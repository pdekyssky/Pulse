from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.schemas.incident_event import IncidentEventCreate
from app.services.exceptions import NotFoundError
from app.services.user_service import get_user_by_id as _get_user_by_id


def _get_incident_by_id(db: Session, incident_id: int) -> Incident:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise NotFoundError("Incident", incident_id)
    return incident


def record_incident_event(
    db: Session,
    *,
    incident_id: int,
    author_id: int,
    event_type: str,
    message: str,
) -> IncidentEvent:
    event = IncidentEvent(
        incident_id=incident_id,
        author_id=author_id,
        event_type=event_type,
        message=message,
    )
    db.add(event)
    return event


def get_events_for_incident(db: Session, incident_id: int) -> list[IncidentEvent]:
    _get_incident_by_id(db, incident_id)

    return list(
        db.scalars(
            select(IncidentEvent)
            .where(IncidentEvent.incident_id == incident_id)
            .order_by(IncidentEvent.created_at)
        ).all()
    )


def create_incident_event(db: Session, data: IncidentEventCreate) -> IncidentEvent:
    _get_incident_by_id(db, data.incident_id)
    _get_user_by_id(db, data.author_id)

    event = record_incident_event(
        db,
        incident_id=data.incident_id,
        author_id=data.author_id,
        event_type=data.event_type,
        message=data.message,
    )
    db.commit()
    db.refresh(event)
    return event
