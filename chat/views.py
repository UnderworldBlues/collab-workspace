from django.http import request
from rest_framework import viewsets
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer
from django.shortcuts import render
from rest_framework import viewsets, permissions

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def get_queryset(self):
        """
        optionally restricts the returned messages to a given room,
        by filtering against a `room` query parameter in the URL
        """
        queryset = super().get_queryset()
        room_id = self.request.query_params.get('room')
        if room_id is not None:
            queryset = queryset.filter(room_id=room_id)
        return queryset

    def perform_create(self, serializer):
        #automatically set the sender to the currently logged-in user
        serializer.save(sender=self.request.user)

def room_test_view(request, room_id):
    return render(request, 'chat/room.html', {'room_id': room_id})