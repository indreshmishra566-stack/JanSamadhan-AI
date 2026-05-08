from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0004_user_designation_user_reports_to_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="department",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_departments", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="department",
            name="parent",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="children", to="grievance_app.department"),
        ),
    ]
