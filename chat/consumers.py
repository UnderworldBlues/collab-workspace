import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message
from .tasks import send_mention_notification

class WorkspaceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.global_group = 'global_workspace'

        if not self.user.is_authenticated:
            await self.accept()
            await self.close(code=4001)
            return
        
        await self.channel_layer.group_add(
            self.global_group,
            self.channel_name
        )
        await self.accept()
        await self.update_user_status(self.user, 'online')
        await self.channel_layer.group_send(
            self.global_group,
            {
                'type': 'user_status_change',
                'user': self.user.username,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.update_user_status(self.user, 'offline')
            await self.channel_layer.group_send(
                self.global_group,
                {
                    'type': 'user_status_change',
                    'user': self.user.username,
                    'status': 'offline'
                }
            )
            await self.channel_layer.group_discard(
                self.global_group,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        # handle dynamic room joining
        if action == 'join_room':
            room_id = text_data_json['room_id']
            room_group_name = f'chat_{room_id}'
            await self.channel_layer.group_add(
                room_group_name,
                self.channel_name
            )
        # handle dynamic room leaving
        elif action == 'leave_room':
            room_id = text_data_json['room_id']
            room_group_name = f'chat_{room_id}'
            await self.channel_layer.group_discard(
                room_group_name,
                self.channel_name
            )
        #sending a message requires the room id in payload
        elif action == 'send_message':
            room_id = text_data_json['room_id']
            message = text_data_json['message']
            room_group_name = f'chat_{room_id}'
            await self.save_message(self.user, room_id, message)
            await self.channel_layer.group_send(
                room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender': self.user.username,
                    'room_id': room_id
                }
            )
        #sending a message requires the room id
        elif action == 'set_typing':
            room_id = text_data_json['room_id']
            room_group_name = f'chat_{room_id}'
            await self.channel_layer.group_send(
                room_group_name,
                {
                    'type': 'user_typing',
                    'is_typing': text_data_json['is_typing'],
                    'user': self.user.username,
                    'room_id': room_id
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'action': 'receive_message',
            'message': event['message'],
            'sender': event['sender'],
            'room_id': event['room_id']
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'action': 'typing_indicator',
            'is_typing': event['is_typing'],
            'user': event['user'],
            'room_id': event['room_id']
        }))

    async def user_status_change(self, event):
        await self.send(text_data=json.dumps({
            'action': 'status_update',
            'user': event['user'],
            'status': event['status']
        }))

    @database_sync_to_async
    def save_message(self, user, room_id, message_content):
        room = Room.objects.get(id=room_id)
        Message.objects.create(room=room, sender=user, content=message_content)
        mentions = re.findall(r'@(\w+)', message_content)
        for mentioned_user in mentions:
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