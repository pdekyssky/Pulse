"""System-wide audit log action and resource type constants."""


class AuditResourceType:
    user = "user"
    service = "service"
    incident = "incident"
    alert = "alert"
    comment = "comment"


class AuditAction:
    user_created = "user.created"
    user_role_changed = "user.role_changed"
    user_deactivated = "user.deactivated"

    service_created = "service.created"
    service_updated = "service.updated"
    service_deleted = "service.deleted"

    incident_created = "incident.created"
    incident_updated = "incident.updated"
    incident_deleted = "incident.deleted"
    incident_assigned = "incident.assigned"

    alert_created = "alert.created"
    alert_updated = "alert.updated"
    alert_linked = "alert.linked"
    alert_resolved = "alert.resolved"

    comment_created = "comment.created"
    comment_updated = "comment.updated"
    comment_deleted = "comment.deleted"
