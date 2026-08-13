from enum import StrEnum


class TimelineEventType(StrEnum):
    incident_created = "incident_created"
    incident_updated = "incident_updated"
    incident_resolved = "incident_resolved"
    alert_triggered = "alert_triggered"
    alert_acknowledged = "alert_acknowledged"
    service_degraded = "service_degraded"
    service_recovered = "service_recovered"
    deployment = "deployment"
    maintenance = "maintenance"


class TimelineEventSeverity(StrEnum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class TimelinePeriod(StrEnum):
    all = "all"
    today = "today"
    seven_days = "7d"
    thirty_days = "30d"


INCIDENT_EVENT_TYPE_MAP: dict[str, TimelineEventType] = {
    "status_change": TimelineEventType.incident_updated,
    "severity_change": TimelineEventType.incident_updated,
    "assignment": TimelineEventType.incident_updated,
    "alert_linked": TimelineEventType.incident_updated,
    "alert_unlinked": TimelineEventType.incident_updated,
    "comment": TimelineEventType.incident_updated,
    "comment_edited": TimelineEventType.incident_updated,
    "comment_deleted": TimelineEventType.incident_updated,
    "resolution": TimelineEventType.incident_resolved,
}

INCIDENT_TYPES = frozenset(
    {
        TimelineEventType.incident_created,
        TimelineEventType.incident_updated,
        TimelineEventType.incident_resolved,
    }
)

ALERT_TYPES = frozenset(
    {
        TimelineEventType.alert_triggered,
        TimelineEventType.alert_acknowledged,
    }
)

SERVICE_TYPES = frozenset(
    {
        TimelineEventType.service_degraded,
        TimelineEventType.service_recovered,
        TimelineEventType.deployment,
        TimelineEventType.maintenance,
    }
)
