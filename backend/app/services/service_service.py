from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit_actions import AuditAction, AuditResourceType
from app.core.service_health import ACTIVE_INCIDENT_STATUSES, service_status_from_severities
from app.core.service_status import ServiceStatus
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.services.audit_service import create_audit_log
from app.services.exceptions import NotFoundError
from app.services.user_service import get_user_by_id as _get_user_by_id


def get_service_by_id(db: Session, service_id: int) -> Service:
    service = db.get(Service, service_id)
    if service is None:
        raise NotFoundError("Service", service_id)
    return service


def list_services(db: Session) -> list[Service]:
    return list(db.scalars(select(Service).order_by(Service.name)).all())


def recalculate_service_status(db: Session, service_id: int) -> Service:
    """Set service status from its active (non-resolved) incidents."""
    service = get_service_by_id(db, service_id)

    severities = list(
        db.scalars(
            select(Incident.severity).where(
                Incident.service_id == service_id,
                Incident.status.in_(ACTIVE_INCIDENT_STATUSES),
            )
        ).all()
    )

    service.status = service_status_from_severities(severities).value
    return service


def create_service(db: Session, data: ServiceCreate, actor_id: int) -> Service:
    _get_user_by_id(db, data.owner_id)

    service = Service(
        **data.model_dump(mode="json"),
        status=ServiceStatus.operational.value,
    )
    db.add(service)
    db.flush()
    create_audit_log(
        db,
        user_id=actor_id,
        action=AuditAction.service_created,
        resource_type=AuditResourceType.service,
        resource_id=service.id,
        description=f'Service "{service.name}" created.',
    )
    db.commit()
    db.refresh(service)
    return service


def update_service(
    db: Session,
    service_id: int,
    data: ServiceUpdate,
    actor_id: int,
) -> Service:
    service = get_service_by_id(db, service_id)
    update_data = data.model_dump(exclude_unset=True)

    if "owner_id" in update_data:
        _get_user_by_id(db, update_data["owner_id"])

    for field, value in update_data.items():
        setattr(service, field, value)

    create_audit_log(
        db,
        user_id=actor_id,
        action=AuditAction.service_updated,
        resource_type=AuditResourceType.service,
        resource_id=service.id,
        description=f'Service "{service.name}" updated.',
    )
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service_id: int, actor_id: int) -> None:
    service = get_service_by_id(db, service_id)
    service_name = service.name

    incident_count = db.scalar(
        select(func.count()).select_from(Incident).where(Incident.service_id == service_id)
    )
    if incident_count:
        raise ValueError("Cannot delete service while incidents reference it")

    alert_count = db.scalar(
        select(func.count()).select_from(Alert).where(Alert.service_id == service_id)
    )
    if alert_count:
        raise ValueError("Cannot delete service while alerts reference it")

    db.delete(service)
    create_audit_log(
        db,
        user_id=actor_id,
        action=AuditAction.service_deleted,
        resource_type=AuditResourceType.service,
        resource_id=service_id,
        description=f'Service "{service_name}" deleted.',
    )
    db.commit()
