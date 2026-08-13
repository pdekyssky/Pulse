import math

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.alert_status import AlertStatus, validate_status_transition
from app.core.audit_actions import AuditAction, AuditResourceType
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertListQuery, AlertUpdate, PaginatedAlertResponse
from app.services.audit_service import create_audit_log
from app.services.exceptions import NotFoundError
from app.services.incident_event_service import record_incident_event
from app.services.incident_service import get_incident_by_id as _get_incident_by_id
from app.services.notification_service import create_notification
from app.services.service_service import get_service_by_id as _get_service_by_id


def _acknowledge_if_new(alert: Alert) -> None:
    if alert.status == AlertStatus.new.value:
        alert.status = AlertStatus.acknowledged.value


def _link_alert_to_incident(
    db: Session,
    alert: Alert,
    incident_id: int,
    actor_id: int,
) -> None:
    incident = _get_incident_by_id(db, incident_id)
    alert.incident_id = incident_id
    _acknowledge_if_new(alert)
    record_incident_event(
        db,
        incident_id=incident_id,
        author_id=actor_id,
        event_type="alert_linked",
        message=f'Alert "{alert.name}" linked to incident.',
    )

    recipient_id = incident.assigned_to_id or incident.created_by_id
    if recipient_id is not None and recipient_id != actor_id:
        create_notification(
            db,
            user_id=recipient_id,
            type="alert_linked",
            title="Alert linked to incident",
            message=(
                f'Alert "{alert.name}" was linked to incident #{incident_id}'
            ),
            incident_id=incident_id,
            alert_id=alert.id,
        )

    create_audit_log(
        db,
        user_id=actor_id,
        action=AuditAction.alert_linked,
        resource_type=AuditResourceType.alert,
        resource_id=alert.id,
        description=(
            f'Alert "{alert.name}" linked to incident #{incident_id}.'
        ),
    )


def get_alert_by_id(db: Session, alert_id: int) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise NotFoundError("Alert", alert_id)
    return alert


def _alert_list_conditions(query: AlertListQuery) -> list:
    conditions = []

    if query.search:
        pattern = f"%{query.search}%"
        conditions.append(
            or_(
                Alert.name.ilike(pattern),
                Alert.description.ilike(pattern),
            )
        )
    if query.status is not None:
        conditions.append(Alert.status == query.status.value)
    if query.severity is not None:
        conditions.append(Alert.severity == query.severity.value)
    if query.service_id is not None:
        conditions.append(Alert.service_id == query.service_id)
    if query.incident_id is not None:
        conditions.append(Alert.incident_id == query.incident_id)

    return conditions


def list_alerts(db: Session, query: AlertListQuery) -> PaginatedAlertResponse:
    conditions = _alert_list_conditions(query)

    count_stmt = select(func.count()).select_from(Alert)
    items_stmt = select(Alert).order_by(Alert.created_at.desc())

    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        items_stmt = items_stmt.where(condition)

    total = db.scalar(count_stmt) or 0
    offset = (query.page - 1) * query.page_size
    items = list(db.scalars(items_stmt.offset(offset).limit(query.page_size)).all())
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0

    return PaginatedAlertResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
    )


def create_alert(db: Session, data: AlertCreate, actor_id: int) -> Alert:
    _get_service_by_id(db, data.service_id)

    payload = data.model_dump(mode="json")
    incident_id = payload.pop("incident_id", None)

    if incident_id is not None:
        _get_incident_by_id(db, incident_id)

    alert = Alert(**payload)
    db.add(alert)
    db.flush()
    create_audit_log(
        db,
        user_id=actor_id,
        action=AuditAction.alert_created,
        resource_type=AuditResourceType.alert,
        resource_id=alert.id,
        description=f'Alert "{alert.name}" created.',
    )

    if incident_id is not None:
        _link_alert_to_incident(db, alert, incident_id, actor_id)

    db.commit()
    db.refresh(alert)
    return alert


def acknowledge_alert(db: Session, alert_id: int, actor_id: int) -> Alert:
    alert = get_alert_by_id(db, alert_id)
    validate_status_transition(alert.status, AlertStatus.acknowledged.value)

    if alert.status != AlertStatus.acknowledged.value:
        alert.status = AlertStatus.acknowledged.value
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.alert_updated,
            resource_type=AuditResourceType.alert,
            resource_id=alert.id,
            description=f'Alert "{alert.name}" acknowledged.',
        )
        db.commit()
        db.refresh(alert)

    return alert


def resolve_alert(db: Session, alert_id: int, actor_id: int) -> Alert:
    alert = get_alert_by_id(db, alert_id)
    validate_status_transition(alert.status, AlertStatus.resolved.value)

    if alert.status != AlertStatus.resolved.value:
        alert.status = AlertStatus.resolved.value
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.alert_resolved,
            resource_type=AuditResourceType.alert,
            resource_id=alert.id,
            description=f'Alert "{alert.name}" resolved.',
        )
        db.commit()
        db.refresh(alert)

    return alert


def update_alert(
    db: Session,
    alert_id: int,
    data: AlertUpdate,
    actor_id: int,
) -> Alert:
    alert = get_alert_by_id(db, alert_id)
    update_data = data.model_dump(exclude_unset=True, mode="json")
    old_incident_id = alert.incident_id
    old_status = alert.status
    linked_this_update = False

    if "service_id" in update_data:
        _get_service_by_id(db, update_data["service_id"])

    if "incident_id" in update_data:
        new_incident_id = update_data["incident_id"]

        if new_incident_id == old_incident_id:
            del update_data["incident_id"]
        elif new_incident_id is None:
            if old_incident_id is not None:
                alert.incident_id = None
                record_incident_event(
                    db,
                    incident_id=old_incident_id,
                    author_id=actor_id,
                    event_type="alert_unlinked",
                    message=f'Alert "{alert.name}" unlinked from incident.',
                )
            del update_data["incident_id"]
        elif old_incident_id is not None:
            raise ValueError(
                f"Alert is already associated with incident {old_incident_id}"
            )
        else:
            _link_alert_to_incident(db, alert, new_incident_id, actor_id)
            linked_this_update = True
            del update_data["incident_id"]

    if "status" in update_data:
        new_status = update_data["status"]
        if isinstance(new_status, AlertStatus):
            new_status = new_status.value
        validate_status_transition(alert.status, new_status)
        update_data["status"] = new_status

    for field, value in update_data.items():
        setattr(alert, field, value)

    if (
        "status" in update_data
        and update_data["status"] == AlertStatus.resolved.value
        and old_status != AlertStatus.resolved.value
    ):
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.alert_resolved,
            resource_type=AuditResourceType.alert,
            resource_id=alert.id,
            description=f'Alert "{alert.name}" resolved.',
        )
    elif update_data and not linked_this_update:
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.alert_updated,
            resource_type=AuditResourceType.alert,
            resource_id=alert.id,
            description=f'Alert "{alert.name}" updated.',
        )

    db.commit()
    db.refresh(alert)
    return alert


def delete_alert(db: Session, alert_id: int) -> None:
    alert = get_alert_by_id(db, alert_id)
    db.delete(alert)
    db.commit()
