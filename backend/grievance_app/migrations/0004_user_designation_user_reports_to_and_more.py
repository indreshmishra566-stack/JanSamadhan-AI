from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0003_alter_complaint_current_level"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="designation",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="reports_to",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="direct_reports", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="department",
            name="sub_head_officer",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sub_headed_departments", to=settings.AUTH_USER_MODEL),
        ),
    ]
