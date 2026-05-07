from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Department, Complaint, ComplaintHistory, Notification


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "phone", "password", "password2", "first_name", "last_name"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data, role="CITIZEN")
        return user


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "phone", "role", "first_name", "last_name",
                  "department", "department_name", "employee_id", "is_verified", "date_joined",
                  "state", "district", "block", "created_by"]
        read_only_fields = ["date_joined", "is_verified"]


class DepartmentSerializer(serializers.ModelSerializer):
    complaint_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ["id", "name", "code", "description", "email", "is_active",
                  "head_officer", "complaint_count", "created_at"]

    def get_complaint_count(self, obj):
        return obj.complaints.filter(status__in=["PENDING", "ASSIGNED", "IN_PROGRESS"]).count()


class ComplaintHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = ComplaintHistory
        fields = ["id", "old_status", "new_status", "note", "changed_by_name", "created_at"]


class ComplaintSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source="citizen.get_full_name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    officer_name = serializers.CharField(source="assigned_officer.get_full_name", read_only=True)
    history = ComplaintHistorySerializer(many=True, read_only=True)
    sla_remaining_hours = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "id", "ticket_id", "title", "description", "original_language",
            "translated_description", "category", "ai_category", "ai_confidence",
            "priority", "status", "department", "department_name", "assigned_officer",
            "officer_name", "citizen_name", "location", "latitude", "longitude",
            "attachment", "proof_of_resolution", "officer_remarks", "admin_override_note",
            "sla_deadline", "sla_remaining_hours", "is_sla_breached",
            "citizen_rating", "citizen_feedback", "is_duplicate",
            "created_at", "updated_at", "resolved_at", "history",
        ]
        read_only_fields = [
            "ticket_id", "ai_category", "ai_confidence", "original_language",
            "translated_description", "is_sla_breached", "sla_deadline",
            "created_at", "updated_at",
        ]

    def get_sla_remaining_hours(self, obj):
        from django.utils import timezone
        if obj.sla_deadline:
            delta = obj.sla_deadline - timezone.now()
            return round(delta.total_seconds() / 3600, 1)
        return None


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ["title", "description", "location", "latitude", "longitude", "attachment"]

    def create(self, validated_data):
        from .ai_service import classify_complaint
        from django.conf import settings
        from django.utils import timezone

        text = validated_data["description"]
        ai_result = classify_complaint(text)

        validated_data["ai_category"] = ai_result.get("category", "OTHER")
        validated_data["category"] = ai_result.get("category", "OTHER")
        validated_data["priority"] = ai_result.get("priority", "LOW")
        validated_data["ai_confidence"] = ai_result.get("confidence", 0.0)
        validated_data["original_language"] = ai_result.get("original_lang", "en")
        validated_data["translated_description"] = ai_result.get("translated_text", text)

        # Auto-assign department
        from .models import Department
        dept = Department.objects.filter(
            code=ai_result.get("category", "OTHER"), is_active=True
        ).first()
        if dept:
            validated_data["department"] = dept

        hours = settings.SLA_HOURS.get(validated_data["priority"], 168)
        validated_data["sla_deadline"] = timezone.now() + timezone.timedelta(hours=hours)

        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "message", "is_read", "created_at",
                  "complaint"]


class AdminComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ["category", "priority", "department", "assigned_officer",
                  "status", "admin_override_note"]


class OfficerComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ["status", "officer_remarks", "proof_of_resolution"]


class CitizenFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ["citizen_rating", "citizen_feedback"]

    def validate_citizen_rating(self, value):
        if value not in range(1, 6):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ForwardingRecordSerializer(serializers.ModelSerializer):
    from_user_name = serializers.SerializerMethodField()
    to_user_name = serializers.SerializerMethodField()

    class Meta:
        from .models import ForwardingRecord
        model = ForwardingRecord
        fields = ["id", "from_user_name", "to_user_name", "from_level", "to_level", "action", "note", "created_at"]

    def get_from_user_name(self, obj):
        if obj.from_user:
            return obj.from_user.get_full_name() or obj.from_user.username
        return "System"

    def get_to_user_name(self, obj):
        if obj.to_user:
            return obj.to_user.get_full_name() or obj.to_user.username
        return "Unknown"
