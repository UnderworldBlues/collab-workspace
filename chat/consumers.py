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

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
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