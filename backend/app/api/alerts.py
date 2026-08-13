from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_operator
from app.api.errors import handle_service_error
from app.core.alert_status import AlertStatus
from app.core.incident_severity import IncidentSeverity
from app.db.session import get_db
from app.models.user import User
from app.schemas.alert import (
    AlertCreate,
    AlertListQuery,
    AlertResponse,
    AlertUpdate,
    PaginatedAlertResponse,
)
from app.services import alert_service

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedAlertResponse)
def list_alerts(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: AlertStatus | None = None,
    severity: IncidentSeverity | None = None,
    service_id: int | None = Query(default=None, gt=0),
    incident_id: int | None = Query(default=None, gt=0),
):
    query = AlertListQuery(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        severity=severity,
        service_id=service_id,
        incident_id=incident_id,
    )
    return alert_service.list_alerts(db, query)


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    try:
        return alert_service.get_alert_by_id(db, alert_id)
    except Exception as error:
        handle_service_error(error)


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return alert_service.create_alert(db, data, actor_id=current_user.id)
    except Exception as error:
        handle_service_error(error)


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return alert_service.acknowledge_alert(
            db,
            alert_id,
            actor_id=current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return alert_service.resolve_alert(
            db,
            alert_id,
            actor_id=current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: int,
    data: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return alert_service.update_alert(
            db,
            alert_id,
            data,
            actor_id=current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        alert_service.delete_alert(db, alert_id)
    except Exception as error:
        handle_service_error(error)
