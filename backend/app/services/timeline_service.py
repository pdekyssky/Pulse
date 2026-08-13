import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.alert_status import AlertStatus
from app.core.incident_status import IncidentStatus
from app.core.service_health import ACTIVE_INCIDENT_STATUSES
from app.core.timeline_event_type import (
    ALERT_TYPES,
    INCIDENT_EVENT_TYPE_MAP,
    INCIDENT_TYPES,
    SERVICE_TYPES,
    TimelineEventSeverity,
    TimelineEventType,
    TimelinePeriod,
)
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.schemas.timeline import (
    PaginatedTimelineResponse,
    TimelineEventResponse,
    TimelineListQuery,
    TimelineStatsResponse,
)


@dataclass(frozen=True)
class _TimelineEventDraft:
    id: str
    timestamp: datetime
    type: TimelineEventType
    title: str
    description: str
    service_id: int | None = None
    incident_id: int | None = None
    alert_id: int | None = None
    severity: TimelineEventSeverity | None = None

    def to_response(self) -> TimelineEventResponse:
        return TimelineEventResponse(
            id=self.id,
            timestamp=self.timestamp,
            type=self.type,
            title=self.title,
            description=self.description,
            service_id=self.service_id,
            incident_id=self.incident_id,
            alert_id=self.alert_id,
            severity=self.severity,
        )


def _period_start(period: TimelinePeriod) -> datetime | None:
    now = datetime.now(timezone.utc)
    if period == TimelinePeriod.today:
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == TimelinePeriod.seven_days:
        return now - timedelta(days=7)
    if period == TimelinePeriod.thirty_days:
        return now - timedelta(days=30)
    return None


def _severity_from_incident(severity: str) -> TimelineEventSeverity:
    return TimelineEventSeverity(severity)


def _severity_from_alert(severity: str) -> TimelineEventSeverity:
    return TimelineEventSeverity(severity)


def _service_has_active_incidents(db: Session, service_id: int, exclude_incident_id: int) -> bool:
    count = db.scalar(
        select(Incident.id)
        .where(
            Incident.service_id == service_id,
            Incident.id != exclude_incident_id,
            Incident.status.in_(ACTIVE_INCIDENT_STATUSES),
        )
        .limit(1)
    )
    return count is not None


def _incident_conditions(query: TimelineListQuery, period_start: datetime | None) -> list:
    conditions = []
    if query.service_id is not None:
        conditions.append(Incident.service_id == query.service_id)
    if query.incident_id is not None:
        conditions.append(Incident.id == query.incident_id)
    if period_start is not None:
        conditions.append(Incident.created_at >= period_start)
    return conditions


def _alert_conditions(query: TimelineListQuery, period_start: datetime | None) -> list:
    conditions = []
    if query.service_id is not None:
        conditions.append(Alert.service_id == query.service_id)
    if query.incident_id is not None:
        conditions.append(Alert.incident_id == query.incident_id)
    if query.alert_id is not None:
        conditions.append(Alert.id == query.alert_id)
    if period_start is not None:
        conditions.append(Alert.created_at >= period_start)
    return conditions


def _incident_event_conditions(query: TimelineListQuery, period_start: datetime | None) -> list:
    conditions = []
    if query.incident_id is not None:
        conditions.append(IncidentEvent.incident_id == query.incident_id)
    if query.service_id is not None:
        conditions.append(Incident.service_id == query.service_id)
    if period_start is not None:
        conditions.append(IncidentEvent.created_at >= period_start)
    return conditions


def _collect_incident_events(
    db: Session,
    query: TimelineListQuery,
    period_start: datetime | None,
) -> tuple[list[_TimelineEventDraft], set[int]]:
    if query.alert_id is not None:
        return []

    conditions = _incident_event_conditions(query, period_start)
    stmt = (
        select(IncidentEvent, Incident)
        .join(Incident, IncidentEvent.incident_id == Incident.id)
        .order_by(IncidentEvent.created_at.desc())
    )
    for condition in conditions:
        stmt = stmt.where(condition)

    drafts: list[_TimelineEventDraft] = []
    resolution_incident_ids: set[int] = set()

    for event, incident in db.execute(stmt).all():
        timeline_type = INCIDENT_EVENT_TYPE_MAP.get(event.event_type)
        if timeline_type is None:
            continue

        if timeline_type == TimelineEventType.incident_resolved:
            resolution_incident_ids.add(incident.id)

        drafts.append(
            _TimelineEventDraft(
                id=f"incident-event-{event.id}",
                timestamp=event.created_at,
                type=timeline_type,
                title=incident.title,
                description=event.message,
                service_id=incident.service_id,
                incident_id=incident.id,
                severity=_severity_from_incident(incident.severity),
            )
        )

        if (
            timeline_type == TimelineEventType.incident_resolved
            and not _service_has_active_incidents(db, incident.service_id, incident.id)
        ):
            drafts.append(
                _TimelineEventDraft(
                    id=f"service-recovered-event-{event.id}",
                    timestamp=event.created_at,
                    type=TimelineEventType.service_recovered,
                    title="Service recovered",
                    description=(
                        f"Service restored after incident #{incident.id} was resolved."
                    ),
                    service_id=incident.service_id,
                    incident_id=incident.id,
                    severity=TimelineEventSeverity.info,
                )
            )

    return drafts, resolution_incident_ids


def _collect_incident_lifecycle_events(
    db: Session,
    query: TimelineListQuery,
    period_start: datetime | None,
    resolution_incident_ids: set[int],
) -> list[_TimelineEventDraft]:
    if query.alert_id is not None:
        return []

    conditions = _incident_conditions(query, period_start)
    stmt = select(Incident).order_by(Incident.created_at.desc())
    for condition in conditions:
        stmt = stmt.where(condition)

    drafts: list[_TimelineEventDraft] = []

    for incident in db.scalars(stmt).all():
        severity = _severity_from_incident(incident.severity)
        description = incident.description or f"Incident #{incident.id} opened."

        drafts.append(
            _TimelineEventDraft(
                id=f"incident-created-{incident.id}",
                timestamp=incident.created_at,
                type=TimelineEventType.incident_created,
                title=incident.title,
                description=description,
                service_id=incident.service_id,
                incident_id=incident.id,
                severity=severity,
            )
        )

        if incident.status != IncidentStatus.resolved.value:
            drafts.append(
                _TimelineEventDraft(
                    id=f"service-degraded-{incident.id}",
                    timestamp=incident.created_at,
                    type=TimelineEventType.service_degraded,
                    title=f"{incident.title} — service impact",
                    description=(
                        f"Service health affected by active {incident.severity} incident."
                    ),
                    service_id=incident.service_id,
                    incident_id=incident.id,
                    severity=severity,
                )
            )

        if (
            incident.resolved_at is not None
            and incident.id not in resolution_incident_ids
        ):
            drafts.append(
                _TimelineEventDraft(
                    id=f"incident-resolved-{incident.id}",
                    timestamp=incident.resolved_at,
                    type=TimelineEventType.incident_resolved,
                    title=incident.title,
                    description=f"Incident #{incident.id} resolved.",
                    service_id=incident.service_id,
                    incident_id=incident.id,
                    severity=severity,
                )
            )

            if not _service_has_active_incidents(db, incident.service_id, incident.id):
                drafts.append(
                    _TimelineEventDraft(
                        id=f"service-recovered-{incident.id}",
                        timestamp=incident.resolved_at,
                        type=TimelineEventType.service_recovered,
                        title="Service recovered",
                        description=(
                            f"Service restored after incident #{incident.id} was resolved."
                        ),
                        service_id=incident.service_id,
                        incident_id=incident.id,
                        severity=TimelineEventSeverity.info,
                    )
                )

    return drafts


def _collect_alert_events(
    db: Session,
    query: TimelineListQuery,
    period_start: datetime | None,
) -> list[_TimelineEventDraft]:
    conditions = _alert_conditions(query, period_start)
    stmt = select(Alert).order_by(Alert.created_at.desc())
    for condition in conditions:
        stmt = stmt.where(condition)

    drafts: list[_TimelineEventDraft] = []

    for alert in db.scalars(stmt).all():
        severity = _severity_from_alert(alert.severity)
        description = alert.description or f"Alert #{alert.id} triggered."

        drafts.append(
            _TimelineEventDraft(
                id=f"alert-triggered-{alert.id}",
                timestamp=alert.created_at,
                type=TimelineEventType.alert_triggered,
                title=alert.name,
                description=description,
                service_id=alert.service_id,
                incident_id=alert.incident_id,
                alert_id=alert.id,
                severity=severity,
            )
        )

        if alert.status in {
            AlertStatus.acknowledged.value,
            AlertStatus.resolved.value,
        } and alert.updated_at > alert.created_at:
            drafts.append(
                _TimelineEventDraft(
                    id=f"alert-acknowledged-{alert.id}",
                    timestamp=alert.updated_at,
                    type=TimelineEventType.alert_acknowledged,
                    title=alert.name,
                    description=f"Alert #{alert.id} acknowledged.",
                    service_id=alert.service_id,
                    incident_id=alert.incident_id,
                    alert_id=alert.id,
                    severity=severity,
                )
            )

    return drafts


def _apply_filters(
    events: list[_TimelineEventDraft],
    query: TimelineListQuery,
    period_start: datetime | None,
) -> list[_TimelineEventDraft]:
    search = (query.search or "").strip().lower()
    filtered: list[_TimelineEventDraft] = []

    for event in events:
        if query.type is not None and event.type != query.type:
            continue

        if period_start is not None and event.timestamp < period_start:
            continue

        if search:
            haystack = f"{event.title} {event.description}".lower()
            if search not in haystack:
                continue

        filtered.append(event)

    filtered.sort(key=lambda item: item.timestamp, reverse=True)
    return filtered


def _compute_stats(events: list[_TimelineEventDraft]) -> TimelineStatsResponse:
    today_start = datetime.now(timezone.utc).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    return TimelineStatsResponse(
        events_today=sum(1 for event in events if event.timestamp >= today_start),
        incidents=sum(1 for event in events if event.type in INCIDENT_TYPES),
        alerts=sum(1 for event in events if event.type in ALERT_TYPES),
        service_events=sum(1 for event in events if event.type in SERVICE_TYPES),
    )


def list_timeline_events(db: Session, query: TimelineListQuery) -> PaginatedTimelineResponse:
    period_start = _period_start(query.period)

    incident_event_drafts, resolution_incident_ids = _collect_incident_events(
        db,
        query,
        period_start,
    )
    lifecycle_drafts = _collect_incident_lifecycle_events(
        db,
        query,
        period_start,
        resolution_incident_ids,
    )
    alert_drafts = _collect_alert_events(db, query, period_start)

    all_events = _apply_filters(
        incident_event_drafts + lifecycle_drafts + alert_drafts,
        query,
        period_start,
    )
    stats = _compute_stats(all_events)

    total = len(all_events)
    offset = (query.page - 1) * query.page_size
    page_items = all_events[offset : offset + query.page_size]
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0

    return PaginatedTimelineResponse(
        items=[event.to_response() for event in page_items],
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
        stats=stats,
    )
