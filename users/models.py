from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    STATUS_CHOICES = (
        ('online', 'Online'),
        ('away', 'Away'),
        ('busy', 'Do Not Disturb'),
        ('offline', 'Offline'),
    )

    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    title = models.CharField(max_length=100, blank=True, help_text="E.g., Software Engineer, Project Manager")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')

    def __str__(self):
        return f"{self.username} ({self.get_status_display()})"