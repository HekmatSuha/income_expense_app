from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets
from .models import Transaction
from .serializers import TransactionSerializer, UserRegistrationSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by("-date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
