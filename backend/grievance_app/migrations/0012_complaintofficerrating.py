from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0011_user_jurisdiction_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="ComplaintOfficerRating",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.IntegerField()),
                ("feedback", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "citizen",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submitted_handler_ratings", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "complaint",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="handler_ratings", to="grievance_app.complaint"),
                ),
                (
                    "officer",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="complaint_handler_ratings", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
                "unique_together": {("complaint", "officer", "citizen")},
            },
        ),
    ]
