from django.db import models
from django.contrib.auth.models import User


class BankAccount(models.Model):
    ACCOUNT_TYPE_MAX_LENGTH = 50

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bank_accounts")
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=ACCOUNT_TYPE_MAX_LENGTH)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class Transaction(models.Model):
    TYPE_CHOICES = (
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
        ("TRANSFER", "Transfer"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=8, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50)
    date = models.DateTimeField()
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"
