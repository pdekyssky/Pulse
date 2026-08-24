from enum import StrEnum


class UserRole(StrEnum):
    admin = "admin"
    engineer = "engineer"
    responder = "responder"
    viewer = "viewer"


OPERATOR_ROLES: frozenset[str] = frozenset(
    {
        UserRole.admin.value,
        UserRole.engineer.value,
        UserRole.responder.value,
    }
)
