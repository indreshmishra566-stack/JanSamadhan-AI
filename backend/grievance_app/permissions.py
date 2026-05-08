from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class IsPM(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("PM", "ADMIN")


class IsCM(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CM"


class IsDistrictOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "DISTRICT_OFFICER"


class IsBlockOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "BLOCK_OFFICER"


class IsFieldOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("FIELD_OFFICER", "OFFICER")


class IsAnyOfficer(BasePermission):
    """Any authenticated non-citizen user that participates in handling or managing work."""
    OFFICER_ROLES = ("OFFICER", "FIELD_OFFICER", "BLOCK_OFFICER", "DISTRICT_OFFICER", "CM", "PM", "ADMIN")

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in self.OFFICER_ROLES


class IsOfficer(BasePermission):
    """Legacy: field-level officer"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("OFFICER", "FIELD_OFFICER")


class IsCitizen(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CITIZEN"


class IsHierarchyOfficer(BasePermission):
    """Any authenticated non-citizen user who can handle complaints or manage staff."""
    HANDLER_ROLES = ("PM", "ADMIN", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER", "OFFICER")

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in self.HANDLER_ROLES
