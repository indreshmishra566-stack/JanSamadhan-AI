from collections import deque

from django.db.models import Case, IntegerField, Q, Value, When

from .models import Department, User


OFFICER_ROLES = ["OFFICER"]
FALLBACK_ROLES = ["ADMIN"]


ROLE_ORDER = Case(
    When(role="ADMIN", then=Value(1)),
    When(role="OFFICER", then=Value(2)),
    default=Value(99),
    output_field=IntegerField(),
)


def find_department_for_category(category):
    """Map an AI category to an active department, falling back to General / Other."""
    department = Department.objects.filter(code=category, is_active=True).first()
    if department:
        return department
    return Department.objects.filter(code="OTHER", is_active=True).first()


def find_department_owner(department):
    """
    Resolve the first grievance owner for a department.

    The preferred path mirrors a public grievance workflow: route to the
    department's designated head officer. If that is not configured,
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
        .filter(role__in=FALLBACK_ROLES, is_active=True)
        .order_by(ROLE_ORDER, "date_joined")
        .first()
    )


def _normalized(value):
    return (value or "").strip().lower()


def _department_branch_ids(department):
    if not department:
        return set()

    branch_ids = {department.id}
    queue = deque([department.id])
    while queue:
        current_id = queue.popleft()
        child_ids = list(
            Department.objects.filter(parent_id=current_id, is_active=True).values_list("id", flat=True)
        )
        for child_id in child_ids:
            if child_id not in branch_ids:
                branch_ids.add(child_id)
                queue.append(child_id)
    return branch_ids


def _department_depth_map(department):
    if not department:
        return {}

    depth_map = {department.id: 0}
    queue = deque([(department.id, 0)])
    while queue:
        current_id, depth = queue.popleft()
        child_ids = list(
            Department.objects.filter(parent_id=current_id, is_active=True).values_list("id", flat=True)
        )
        for child_id in child_ids:
            if child_id not in depth_map:
                depth_map[child_id] = depth + 1
                queue.append((child_id, depth + 1))
    return depth_map


def _is_department_leader(officer):
    if not officer:
        return False
    return Department.objects.filter(
        Q(head_officer=officer) | Q(sub_head_officer=officer),
        is_active=True,
    ).exists()


def _candidate_location_score(officer, department, depth_map, target_state, target_district, target_block, location_text):
    score = 0

    officer_state = _normalized(officer.state)
    officer_district = _normalized(officer.district)
    officer_block = _normalized(officer.block)

    if target_state and officer_state == target_state:
        score += 100
    if target_district and officer_district == target_district:
        score += 220
    if target_block and officer_block == target_block:
        score += 320

    if location_text:
        if officer_block and officer_block in location_text:
            score += 180
        if officer_district and officer_district in location_text:
            score += 120
        if officer_state and officer_state in location_text:
            score += 60

    dept_depth = depth_map.get(officer.department_id or department.id, 0)
    score += dept_depth * 40

    if officer.department_id and officer.department_id != department.id:
        score += 40

    if officer.reports_to_id:
        score += 20

    if _is_department_leader(officer):
        score -= 30

    return score


def find_nearest_branch_officer(department, validated_data, citizen=None):
    if not department:
        return None

    branch_ids = _department_branch_ids(department)
    depth_map = _department_depth_map(department)
    target_state = _normalized(validated_data.get("state") or getattr(citizen, "state", ""))
    target_district = _normalized(validated_data.get("district") or getattr(citizen, "district", ""))
    target_block = _normalized(validated_data.get("block") or getattr(citizen, "block", ""))
    location_text = _normalized(validated_data.get("location"))

    candidates = list(
        User.objects.filter(
            department_id__in=branch_ids,
            role__in=OFFICER_ROLES,
            is_active=True,
        )
        .exclude(id=getattr(citizen, "id", None))
        .select_related("department", "reports_to")
        .order_by(ROLE_ORDER, "date_joined")
    )
    if not candidates:
        return None

    verified = [candidate for candidate in candidates if candidate.is_verified]
    candidate_pool = verified or candidates

    ranked = sorted(
        candidate_pool,
        key=lambda candidate: (
            _candidate_location_score(
                candidate,
                department,
                depth_map,
                target_state,
                target_district,
                target_block,
                location_text,
            ),
            int(candidate.is_verified),
            int(bool(candidate.reports_to_id)),
            depth_map.get(candidate.department_id or department.id, 0),
            -candidate.id,
        ),
        reverse=True,
    )

    best = ranked[0] if ranked else None
    if not best:
        return None

    best_score = _candidate_location_score(
        best,
        department,
        depth_map,
        target_state,
        target_district,
        target_block,
        location_text,
    )
    return best if best_score > 0 else None


def find_nearest_any_officer(validated_data, citizen=None):
    target_state = _normalized(validated_data.get("state") or getattr(citizen, "state", ""))
    target_district = _normalized(validated_data.get("district") or getattr(citizen, "district", ""))
    target_block = _normalized(validated_data.get("block") or getattr(citizen, "block", ""))
    location_text = _normalized(validated_data.get("location"))

    candidates = list(
        User.objects.filter(role__in=OFFICER_ROLES, is_active=True)
        .exclude(id=getattr(citizen, "id", None))
        .select_related("department", "reports_to")
        .order_by(ROLE_ORDER, "date_joined")
    )
    if not candidates:
        return None

    verified = [candidate for candidate in candidates if candidate.is_verified]
    candidate_pool = verified or candidates

    def score(candidate):
        candidate_state = _normalized(candidate.state)
        candidate_district = _normalized(candidate.district)
        candidate_block = _normalized(candidate.block)
        total = 0
        if target_state and candidate_state == target_state:
            total += 100
        if target_district and candidate_district == target_district:
            total += 220
        if target_block and candidate_block == target_block:
            total += 320
        if location_text:
            if candidate_block and candidate_block in location_text:
                total += 180
            if candidate_district and candidate_district in location_text:
                total += 120
            if candidate_state and candidate_state in location_text:
                total += 60
        if candidate.reports_to_id:
            total += 20
        return total

    ranked = sorted(
        candidate_pool,
        key=lambda candidate: (
            score(candidate),
            int(candidate.is_verified),
            int(bool(candidate.reports_to_id)),
            -candidate.id,
        ),
        reverse=True,
    )
    return ranked[0] if ranked else None


def apply_initial_grievance_routing(validated_data, category, citizen=None):
    department = find_department_for_category(category)
    if not department:
        return None, None

    validated_data["department"] = department
    validated_data["state"] = validated_data.get("state") or getattr(citizen, "state", "")
    validated_data["district"] = validated_data.get("district") or getattr(citizen, "district", "")
    validated_data["block"] = validated_data.get("block") or getattr(citizen, "block", "")

    officer = find_nearest_branch_officer(department, validated_data, citizen=citizen)
    if not officer:
        officer = find_nearest_any_officer(validated_data, citizen=citizen)
    if officer:
        validated_data["current_level"] = "OFFICER"
    else:
        validated_data["current_level"] = "DEPARTMENT"
        officer = find_department_owner(department)
    if officer:
        validated_data["assigned_officer"] = officer
        validated_data["forwarded_to"] = officer
        validated_data["status"] = "ASSIGNED"

    return department, officer
