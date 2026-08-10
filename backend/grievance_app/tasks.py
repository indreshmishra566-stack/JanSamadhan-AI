from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_sla_breaches():
    """Run every 30 minutes via Celery Beat — marks SLA breaches and escalates."""
    from .models import Complaint, Notification
    now = timezone.now()
    breached = Complaint.objects.filter(
        sla_deadline__lt=now,
        is_sla_breached=False,
        status__in=["PENDING", "ASSIGNED", "IN_PROGRESS"],
    )
    count = 0
    for complaint in breached:
        complaint.is_sla_breached = True
        if complaint.status != "ESCALATED":
            complaint.status = "ESCALATED"
        complaint.save(update_fields=["is_sla_breached", "status"])
        Notification.objects.create(
            recipient=complaint.citizen,
            complaint=complaint,
            notification_type="SLA_BREACH",
            title=f"Your complaint #{complaint.ticket_id} has been escalated",
            message="Your complaint has exceeded the resolution deadline and has been escalated to senior officers.",
        )
        if complaint.assigned_officer:
            Notification.objects.create(
                recipient=complaint.assigned_officer,
                complaint=complaint,
                notification_type="SLA_BREACH",
                title=f"SLA Breach: #{complaint.ticket_id}",
                message=f"Complaint {complaint.ticket_id} has breached SLA. Immediate action required.",
            )
        count += 1
    logger.info(f"SLA check: {count} complaints escalated.")
    return count


@shared_task
def send_email_notification(to_email, subject, body):
    """Async email sending."""
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return f"Email sent to {to_email}"
    except Exception as e:
        logger.error(f"Email failed to {to_email}: {e}")
        return f"Failed: {e}"


@shared_task
def classify_complaint_async(complaint_id):
    """Re-classify a complaint in background."""
    from .models import Complaint
    from .ai_service import classify_complaint
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        result = classify_complaint(complaint.description)
        complaint.ai_category = result.get("category", "OTHER")
        complaint.ai_confidence = result.get("confidence", 0.0)
        complaint.save(update_fields=["ai_category", "ai_confidence"])
        return f"Classified #{complaint.ticket_id} as {complaint.ai_category}"
    except Complaint.DoesNotExist:
        return "Complaint not found"
