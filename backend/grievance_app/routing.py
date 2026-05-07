from django.db.models import Case, IntegerField, Value, When

from .models import Department, User


OFFICER_ROLES = [
    "OFFICER",
    "FIELD_OFFICER",
    "BLOCK_OFFICER",
    "DISTRICT_OFFICER",
    "CM",
    "PM",
    "ADMIN",
]


ROLE_ORDER = Case(
    When(role="ADMIN", then=Value(1)),
    When(role="PM", then=Value(1)),
    When(role="CM", then=Value(2)),
    When(role="DISTRICT_OFFICER", then=Value(3)),
    When(role="BLOCK_OFFICER", then=Value(4)),
    When(role="FIELD_OFFICER", then=Value(5)),
    When(role="OFFICER", then=Value(5)),
    default=Value(99),
    output_field=IntegerField(),
)


def find_department_for_category(category):
    """Map an AI category to an active department, falling back to General / Other."""
    department = Department.objects.filter(code=category, is_active=True).first()
    if department:
        return department
    return Department.objects.filter(code="OTHER", is_active=True).first()


def find_nodal_officer(department):
    """
    Resolve the first grievance owner for a department.

    The preferred path mirrors a public grievance workflow: route to the
    department's designated nodal/head officer. If that is not configured,
    keep the grievance moving by choosing another officer mapped to that
    department before falling back to a senior/admin desk.
    """
    if department and department.head_officer and department.head_officer.is_active:
        return department.head_officer

    if department:
        officer = (
            User.objects
            .filter(department=department, role__in=OFFICER_ROLES, is_active=True, is_verified=True)
            .order_by(ROLE_ORDER, "date_joined")
            .first()
        )
        if officer:
            return officer

        officer = (
            User.objects
            .filter(department=department, role__in=OFFICER_ROLES, is_active=True)
            .order_by(ROLE_ORDER, "date_joined")
            .first()
        )
        if officer:
            return officer

    return (
        User.objects
        .filter(role__in=["ADMIN", "PM"], is_active=True)
        .order_by(ROLE_ORDER, "date_joined")
        .first()
    )


def apply_initial_grievance_routing(validated_data, category):
    department = find_department_for_category(category)
    if not department:
        return None, None

    validated_data["department"] = department
    validated_data["current_level"] = "DEPARTMENT"

    officer = find_nodal_officer(department)
    if officer:
        validated_data["assigned_officer"] = officer
        validated_data["forwarded_to"] = officer
        validated_data["status"] = "ASSIGNED"

    return department, officer
