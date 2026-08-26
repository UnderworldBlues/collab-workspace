from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task
def send_mention_notification(sender_username, receiver_username, message_content):
    try:
        receiver = User.objects.get(username=receiver_username)
        # need to add receiver.status == offline case later
        subject = f"New mention from {sender_username}"
        body = f"You were mentioned in a chat:\n\n'{message_content}'"
        
        send_mail(
            subject=subject,
            message=body,
            from_email='notifications@workspace.local',
            recipient_list=[receiver.email],
            fail_silently=False,
        )
        return f"Notification sent to {receiver_username}"
    except User.DoesNotExist:
        return f"User {receiver_username} not found."