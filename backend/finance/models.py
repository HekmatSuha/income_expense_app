from django.db import models
from django.contrib.auth.models import User

class Transaction(models.Model):
    TYPE_CHOICES = (
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=7, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50)
    date = models.DateTimeField()
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"
