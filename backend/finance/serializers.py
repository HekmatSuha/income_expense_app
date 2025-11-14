from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password")
        extra_kwargs = {
            "email": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
