from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_operator
from app.api.errors import handle_service_error
from app.db.session import get_db
from app.models.user import User
from app.schemas.incident_event import (
    IncidentEventCreate,
    IncidentEventCreateBody,
    IncidentEventResponse,
)
from app.services import incident_event_service

router = APIRouter()


@router.get("", response_model=list[IncidentEventResponse])
def list_incident_events(
    incident_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return incident_event_service.get_events_for_incident(db, incident_id)
    except Exception as error:
        handle_service_error(error)


@router.post("", response_model=IncidentEventResponse, status_code=status.HTTP_201_CREATED)
def create_incident_event(
    incident_id: int,
    data: IncidentEventCreateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return incident_event_service.create_incident_event(
            db,
            IncidentEventCreate(
                incident_id=incident_id,
                author_id=current_user.id,
                **data.model_dump(),
            ),
        )
    except Exception as error:
        handle_service_error(error)
