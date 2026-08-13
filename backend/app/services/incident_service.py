from datetime import datetime, timezone

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.orm import Session

from app.core.audit_actions import AuditAction, AuditResourceType
from app.core.incident_sort import (
    DEFAULT_SORT_FIELD,
    DEFAULT_SORT_ORDER,
    INCIDENT_SORT_COLUMNS,
    SortOrder,
)
from app.core.incident_status import IncidentStatus, validate_status_transition
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.incident_comment import IncidentComment
from app.models.incident_event import IncidentEvent
from app.schemas.incident import IncidentCreate, IncidentListQuery, IncidentUpdate
from app.services.audit_service import create_audit_log
from app.services.exceptions import NotFoundError
from app.services.incident_event_service import record_incident_event
from app.services.notification_service import create_notification
from app.services.service_service import get_service_by_id as _get_service_by_id
from app.services.service_service import recalculate_service_status
from app.services.user_service import get_user_by_id as _get_user_by_id


def _assignment_event_message(
    db: Session,
    old_assigned_id: int | None,
    new_assigned_id: int | None,
) -> str:
    if old_assigned_id is None and new_assigned_id is not None:
        assignee = _get_user_by_id(db, new_assigned_id)
        return f"Incident assigned to {assignee.name}."
    if old_assigned_id is not None and new_assigned_id is not None:
        old_assignee = _get_user_by_id(db, old_assigned_id)
        new_assignee = _get_user_by_id(db, new_assigned_id)
        return f"Incident reassigned from {old_assignee.name} to {new_assignee.name}."
    if old_assigned_id is not None and new_assigned_id is None:
        return "Incident unassigned."
    return ""


def get_incident_by_id(db: Session, incident_id: int) -> Incident:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise NotFoundError("Incident", incident_id)
    return incident


def _incident_list_conditions(query: IncidentListQuery) -> list:
    conditions = []

    if query.search:
        pattern = f"%{query.search}%"
        conditions.append(
            or_(
                Incident.title.ilike(pattern),
                Incident.description.ilike(pattern),
            )
        )
    if query.status is not None:
        conditions.append(Incident.status == query.status.value)
    if query.severity is not None:
        conditions.append(Incident.severity == query.severity.value)
    if query.assigned_to_id is not None:
        conditions.append(Incident.assigned_to_id == query.assigned_to_id)
    if query.service_id is not None:
        conditions.append(Incident.service_id == query.service_id)

    return conditions


def _incident_list_order(query: IncidentListQuery):
    sort_field = query.sort_by or DEFAULT_SORT_FIELD
    sort_order = query.sort_order or DEFAULT_SORT_ORDER
    column = INCIDENT_SORT_COLUMNS[sort_field]
    return column.asc() if sort_order == SortOrder.asc else column.desc()


def list_incidents(db: Session, query: IncidentListQuery) -> tuple[list[Incident], int]:
    conditions = _incident_list_conditions(query)

    count_stmt = select(func.count()).select_from(Incident)
    items_stmt = select(Incident)

    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        items_stmt = items_stmt.where(condition)

    total = db.scalar(count_stmt) or 0
    offset = (query.page - 1) * query.page_size

    items = list(
        db.scalars(
            items_stmt.order_by(_incident_list_order(query))
            .offset(offset)
            .limit(query.page_size)
        ).all()
    )

    return items, total


def create_incident(db: Session, data: IncidentCreate, created_by_id: int) -> Incident:
    _get_service_by_id(db, data.service_id)
    _get_user_by_id(db, created_by_id)

    incident = Incident(**data.model_dump(mode="json"), created_by_id=created_by_id)
    db.add(incident)
    db.flush()

    record_incident_event(
        db,
        incident_id=incident.id,
        author_id=created_by_id,
        event_type="created",
        message="Incident created",
    )

    db.flush()
    recalculate_service_status(db, incident.service_id)

    create_audit_log(
        db,
        user_id=created_by_id,
        action=AuditAction.incident_created,
        resource_type=AuditResourceType.incident,
        resource_id=incident.id,
        description=f'Incident "{incident.title}" created.',
    )

    db.commit()
    db.refresh(incident)
    return incident


def update_incident(
    db: Session,
    incident_id: int,
    data: IncidentUpdate,
    actor_id: int,
) -> Incident:
    incident = get_incident_by_id(db, incident_id)
    update_data = data.model_dump(exclude_unset=True, mode="json")
    old_status = incident.status
    old_severity = incident.severity
    old_assigned_id = incident.assigned_to_id
    old_service_id = incident.service_id

    if update_data.get("status") == old_status:
        update_data.pop("status", None)
    if update_data.get("severity") == old_severity:
        update_data.pop("severity", None)
    if update_data.get("assigned_to_id") == old_assigned_id:
        update_data.pop("assigned_to_id", None)

    if not update_data:
        return incident

    if "service_id" in update_data:
        _get_service_by_id(db, update_data["service_id"])
    if "assigned_to_id" in update_data and update_data["assigned_to_id"] is not None:
        _get_user_by_id(db, update_data["assigned_to_id"])

    if "status" in update_data:
        new_status = update_data["status"]
        if isinstance(new_status, IncidentStatus):
            new_status = new_status.value
        validate_status_transition(old_status, new_status)
        update_data["status"] = new_status
        if (
            new_status == IncidentStatus.resolved.value
            and incident.resolved_at is None
            and "resolved_at" not in update_data
        ):
            update_data["resolved_at"] = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(incident, field, value)

    if "assigned_to_id" in update_data:
        new_assigned_id = update_data["assigned_to_id"]
        if new_assigned_id != old_assigned_id:
            record_incident_event(
                db,
                incident_id=incident.id,
                author_id=actor_id,
                event_type="assignment",
                message=_assignment_event_message(
                    db,
                    old_assigned_id,
                    new_assigned_id,
                ),
            )
            if new_assigned_id is not None and new_assigned_id != actor_id:
                create_notification(
                    db,
                    user_id=new_assigned_id,
                    type="incident_assigned",
                    title="Incident assigned",
                    message=f"You have been assigned incident #{incident.id}",
                    incident_id=incident.id,
                )

    if "severity" in update_data and update_data["severity"] != old_severity:
        record_incident_event(
            db,
            incident_id=incident.id,
            author_id=actor_id,
            event_type="severity_change",
            message=(
                f"Severity changed from {old_severity} to {update_data['severity']}"
            ),
        )

    if "status" in update_data and update_data["status"] != old_status:
        new_status = update_data["status"]
        event_type = (
            "resolution" if new_status == IncidentStatus.resolved.value else "status_change"
        )
        record_incident_event(
            db,
            incident_id=incident.id,
            author_id=actor_id,
            event_type=event_type,
            message=f"Status changed from {old_status} to {new_status}",
        )

    affects_service_health = (
        "status" in update_data
        or "severity" in update_data
        or "service_id" in update_data
    )
    if affects_service_health:
        db.flush()
        recalculate_service_status(db, incident.service_id)
        if "service_id" in update_data and update_data["service_id"] != old_service_id:
            recalculate_service_status(db, old_service_id)

    if "assigned_to_id" in update_data and update_data["assigned_to_id"] != old_assigned_id:
        new_assigned_id = update_data["assigned_to_id"]
        assignee_label = (
            f"user {new_assigned_id}" if new_assigned_id is not None else "unassigned"
        )
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.incident_assigned,
            resource_type=AuditResourceType.incident,
            resource_id=incident.id,
            description=f'Incident #{incident.id} assigned to {assignee_label}.',
        )

    non_assignment_changes = set(update_data.keys()) - {"assigned_to_id"}
    if non_assignment_changes:
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.incident_updated,
            resource_type=AuditResourceType.incident,
            resource_id=incident.id,
            description=f"Incident #{incident.id} updated.",
        )

    db.commit()
    db.refresh(incident)
    return incident


def resolve_incident(db: Session, incident_id: int, actor_id: int) -> Incident:
    return update_incident(
        db,
        incident_id,
        IncidentUpdate(status=IncidentStatus.resolved),
        actor_id=actor_id,
    )


def delete_incident(db: Session, incident_id: int, actor_id: int) -> None:
    incident = get_incident_by_id(db, incident_id)
    service_id = incident.service_id
    incident_title = incident.title

    db.execute(delete(IncidentEvent).where(IncidentEvent.incident_id == incident_id))
    db.execute(delete(IncidentComment).where(IncidentComment.incident_id == incident_id))
    db.execute(
        update(Alert)
        .where(Alert.incident_id == incident_id)
        .values(incident_id=None)
    )

    db.delete(incident)

    db.flush()
    recalculate_service_status(db, service_id)

    create_audit_log(
        db,
        user_id=actor_id,
        action=AuditAction.incident_deleted,
        resource_type=AuditResourceType.incident,
        resource_id=incident_id,
        description=f'Incident "{incident_title}" deleted.',
    )

    db.commit()
