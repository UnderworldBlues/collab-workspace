from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, MessageViewSet, UserViewSet, room_test_view

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test/<str:room_id>/', room_test_view, name='room_test'),
]