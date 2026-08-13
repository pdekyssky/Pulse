from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
import math

from app.api import incident_comments, incident_events
from app.api.deps import get_current_user, require_admin, require_operator
from app.api.errors import handle_service_error
from app.core.incident_severity import IncidentSeverity
from app.core.incident_sort import IncidentSortField, SortOrder
from app.core.incident_status import IncidentStatus
from app.db.session import get_db
from app.models.user import User
from app.schemas.incident import (
    IncidentCreate,
    IncidentListQuery,
    IncidentResponse,
    IncidentUpdate,
    PaginatedIncidentResponse,
)
from app.services import incident_service

router = APIRouter(dependencies=[Depends(get_current_user)])

router.include_router(
    incident_events.router,
    prefix="/{incident_id}/events",
    tags=["incident-events"],
)

router.include_router(
    incident_comments.router,
    prefix="/{incident_id}/comments",
    tags=["incident-comments"],
)


@router.get("", response_model=PaginatedIncidentResponse)
def list_incidents(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: IncidentStatus | None = None,
    severity: IncidentSeverity | None = None,
    assigned_to_id: int | None = None,
    service_id: int | None = None,
    sort_by: IncidentSortField | None = None,
    sort_order: SortOrder | None = None,
):
    query = IncidentListQuery(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        severity=severity,
        assigned_to_id=assigned_to_id,
        service_id=service_id,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    items, total = incident_service.list_incidents(db, query)
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedIncidentResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    try:
        return incident_service.get_incident_by_id(db, incident_id)
    except Exception as error:
        handle_service_error(error)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return incident_service.create_incident(
            db,
            data,
            created_by_id=current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return incident_service.update_incident(
            db,
            incident_id,
            data,
            actor_id=current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        incident_service.delete_incident(db, incident_id, actor_id=current_user.id)
    except Exception as error:
        handle_service_error(error)
