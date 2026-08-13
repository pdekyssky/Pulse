"""Derive service operational status from active incidents."""

from app.core.incident_severity import IncidentSeverity
from app.core.incident_status import IncidentStatus
from app.core.service_status import ServiceStatus

# Active = any incident not in the resolved (terminal) state.
ACTIVE_INCIDENT_STATUSES: frozenset[str] = frozenset(
    status.value
    for status in IncidentStatus
    if status != IncidentStatus.resolved
)

# Highest active incident severity wins when multiple incidents are open.
SEVERITY_RANK: dict[IncidentSeverity, int] = {
    IncidentSeverity.low: 1,
    IncidentSeverity.medium: 2,
    IncidentSeverity.high: 3,
    IncidentSeverity.critical: 4,
}

# Mapping from worst active incident severity to service status.
SEVERITY_TO_SERVICE_STATUS: dict[IncidentSeverity, ServiceStatus] = {
    IncidentSeverity.low: ServiceStatus.degraded,
    IncidentSeverity.medium: ServiceStatus.degraded,
    IncidentSeverity.high: ServiceStatus.partial_outage,
    IncidentSeverity.critical: ServiceStatus.major_outage,
}


def service_status_from_severities(severities: list[str]) -> ServiceStatus:
    """Return service status from active incident severities (empty → operational)."""
    if not severities:
        return ServiceStatus.operational

    worst = max(
        (IncidentSeverity(severity) for severity in severities),
        key=lambda severity: SEVERITY_RANK[severity],
    )
    return SEVERITY_TO_SERVICE_STATUS[worst]
