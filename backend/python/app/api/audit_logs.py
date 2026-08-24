from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.api.errors import handle_service_error
from app.db.session import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogListQuery, AuditLogResponse, PaginatedAuditLogResponse
from app.services import audit_service

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("", response_model=PaginatedAuditLogResponse)
def list_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: int | None = Query(default=None, gt=0),
    action: str | None = None,
    resource_type: str | None = None,
    resource_id: int | None = Query(default=None, gt=0),
    created_from: datetime | None = None,
    created_to: datetime | None = None,
):
    query = AuditLogListQuery(
        page=page,
        page_size=page_size,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        created_from=created_from,
        created_to=created_to,
    )
    return audit_service.list_audit_logs(db, query)


@router.get("/{audit_log_id}", response_model=AuditLogResponse)
def get_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        return audit_service.get_audit_log_by_id(db, audit_log_id)
    except Exception as error:
        handle_service_error(error)
