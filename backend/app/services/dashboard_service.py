from enum import StrEnum

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.alert_status import AlertStatus
from app.core.incident_severity import IncidentSeverity
from app.core.incident_status import IncidentStatus
from app.core.service_health import ACTIVE_INCIDENT_STATUSES
from app.core.service_status import ServiceStatus
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.service import Service
from app.schemas.dashboard import (
    AlertTotals,
    DashboardOverviewResponse,
    IncidentTotals,
    ServiceTotals,
)

RECENT_INCIDENTS_LIMIT = 10


def _empty_counts(enum_class: type[StrEnum]) -> dict[str, int]:
    return {member.value: 0 for member in enum_class}


def _apply_group_counts(
    counts: dict[str, int],
    rows: list[tuple[str, int]],
) -> dict[str, int]:
    for key, value in rows:
        if key in counts:
            counts[key] = value
    return counts


def get_dashboard_overview(db: Session) -> DashboardOverviewResponse:
    incident_total = db.scalar(select(func.count()).select_from(Incident)) or 0
    incident_active = (
        db.scalar(
            select(func.count())
            .select_from(Incident)
            .where(Incident.status.in_(ACTIVE_INCIDENT_STATUSES))
        )
        or 0
    )
    incident_resolved = (
        db.scalar(
            select(func.count())
            .select_from(Incident)
            .where(Incident.status == IncidentStatus.resolved.value)
        )
        or 0
    )

    severity_rows = list(
        db.execute(
            select(Incident.severity, func.count())
            .group_by(Incident.severity)
        ).all()
    )
    status_rows = list(
        db.execute(
            select(Incident.status, func.count()).group_by(Incident.status)
        ).all()
    )

    service_total = db.scalar(select(func.count()).select_from(Service)) or 0
    service_status_rows = list(
        db.execute(
            select(Service.status, func.count()).group_by(Service.status)
        ).all()
    )

    alert_total = db.scalar(select(func.count()).select_from(Alert)) or 0
    alert_active = (
        db.scalar(
            select(func.count())
            .select_from(Alert)
            .where(Alert.status != AlertStatus.resolved.value)
        )
        or 0
    )
    alert_resolved = (
        db.scalar(
            select(func.count())
            .select_from(Alert)
            .where(Alert.status == AlertStatus.resolved.value)
        )
        or 0
    )
    alert_status_rows = list(
        db.execute(select(Alert.status, func.count()).group_by(Alert.status)).all()
    )

    recent_incidents = list(
        db.scalars(
            select(Incident)
            .order_by(Incident.created_at.desc())
            .limit(RECENT_INCIDENTS_LIMIT)
        ).all()
    )

    return DashboardOverviewResponse(
        incidents=IncidentTotals(
            total=incident_total,
            active=incident_active,
            resolved=incident_resolved,
        ),
        incidents_by_severity=_apply_group_counts(
            _empty_counts(IncidentSeverity),
            severity_rows,
        ),
        incidents_by_status=_apply_group_counts(
            _empty_counts(IncidentStatus),
            status_rows,
        ),
        services=ServiceTotals(total=service_total),
        services_by_status=_apply_group_counts(
            _empty_counts(ServiceStatus),
            service_status_rows,
        ),
        alerts=AlertTotals(
            total=alert_total,
            active=alert_active,
            resolved=alert_resolved,
        ),
        alerts_by_status=_apply_group_counts(
            _empty_counts(AlertStatus),
            alert_status_rows,
        ),
        recent_incidents=recent_incidents,
    )
