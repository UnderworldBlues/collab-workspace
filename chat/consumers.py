import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message
from .tasks import send_mention_notification

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        user = self.scope['user']

        if not user.is_authenticated:
            await self.accept()
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        await self.update_user_status(user, 'online')
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status_change',
                'user': user.username,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        user = self.scope['user']
        if user.is_authenticated:
            await self.update_user_status(user, 'offline')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status_change',
                    'user': user.username,
                    'status': 'offline'
                }
            )
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        user = self.scope['user']

        if action == 'send_message':
            message = text_data_json['message']
            # Save message to database before broadcasting
            if user.is_authenticated:
                await self.save_message(user, message)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender': user.username
                    }
                )
        elif action == 'set_typing':
            # Broadcast the typing status to the room
            if user.is_authenticated:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'is_typing': text_data_json['is_typing'],
                        'user': user.username
                    }
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'action': 'receive_message',
            'message': event['message'],
            'sender': event['sender']
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'action': 'typing_indicator',
            'is_typing': event['is_typing'],
            'user': event['user']
        }))

    async def user_status_change(self, event):
        await self.send(text_data=json.dumps({
            'action': 'status_update',
            'user': event['user'],
            'status': event['status']
        }))

    @database_sync_to_async
    def save_message(self, user, message_content):
        room = Room.objects.get(id=self.room_id)
        Message.objects.create(room=room, sender=user, content=message_content)
        # Scan the message for @username mentions
        mentions = re.findall(r'@(\w+)', message_content)
        for mentioned_user in mentions:
            # Trigger the Celery task asynchronously
            send_mention_notification.delay(
                sender_username=user.username,
                receiver_username=mentioned_user,
                message_content=message_content
            )

    @database_sync_to_async
    def update_user_status(self, user, new_status):
        if user.status != new_status:
            user.status = new_status
            user.save(update_fields=['status'])