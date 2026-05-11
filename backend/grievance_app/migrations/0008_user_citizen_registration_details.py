from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0007_loginotp"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="address_line",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="country",
            field=models.CharField(blank=True, default="India", max_length=80),
        ),
        migrations.AddField(
            model_name="user",
            name="gender",
            field=models.CharField(blank=True, choices=[("MALE", "Male"), ("FEMALE", "Female"), ("TRANSGENDER", "Transgender")], max_length=20),
        ),
        migrations.AddField(
            model_name="user",
            name="locality",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="pincode",
            field=models.CharField(blank=True, max_length=12),
        ),
        migrations.AddField(
            model_name="user",
            name="sub_locality",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
