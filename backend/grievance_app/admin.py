from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department, Complaint, ComplaintHistory, Notification


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "role", "department", "is_active"]
    list_filter = ["role", "is_active", "department"]
    fieldsets = UserAdmin.fieldsets + (
        ("Jan Samadhan", {"fields": ("role", "phone", "department", "employee_id", "is_verified")}),
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "email", "is_active"]
    search_fields = ["name", "code"]


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ["ticket_id", "title", "category", "priority", "status",
                    "department", "citizen", "created_at"]
    list_filter = ["status", "priority", "category", "department"]
    search_fields = ["ticket_id", "title", "description"]
    readonly_fields = ["ticket_id", "ai_category", "ai_confidence", "created_at", "updated_at"]


@admin.register(ComplaintHistory)
class ComplaintHistoryAdmin(admin.ModelAdmin):
    list_display = ["complaint", "old_status", "new_status", "changed_by", "created_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["recipient", "notification_type", "title", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read"]
