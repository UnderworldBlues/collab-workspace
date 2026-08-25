from django.db import models
from django.conf import settings

class Room(models.Model):
    name = models.CharField(max_length=128, unique=True)
    description = models.TextField(blank=True, help_text="What is this room about?")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        #order messages chronologically by default
        ordering = ['timestamp']
    def __str__(self):
        return f"{self.sender.username} in {self.room.name} at {self.timestamp.strftime('%H:%M')}"