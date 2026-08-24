import math

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogListQuery, PaginatedAuditLogResponse
from app.services.exceptions import NotFoundError


def create_audit_log(
    db: Session,
    *,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: int | None,
    description: str,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
    )
    db.add(audit_log)
    return audit_log


def get_audit_log_by_id(db: Session, audit_log_id: int) -> AuditLog:
    audit_log = db.get(AuditLog, audit_log_id)
    if audit_log is None:
        raise NotFoundError("AuditLog", audit_log_id)
    return audit_log


def list_audit_logs(db: Session, query: AuditLogListQuery) -> PaginatedAuditLogResponse:
    conditions = []

    if query.user_id is not None:
        conditions.append(AuditLog.user_id == query.user_id)
    if query.action is not None:
        conditions.append(AuditLog.action == query.action)
    if query.resource_type is not None:
        conditions.append(AuditLog.resource_type == query.resource_type)
    if query.resource_id is not None:
        conditions.append(AuditLog.resource_id == query.resource_id)
    if query.created_from is not None:
        conditions.append(AuditLog.created_at >= query.created_from)
    if query.created_to is not None:
        conditions.append(AuditLog.created_at <= query.created_to)

    count_stmt = select(func.count()).select_from(AuditLog)
    items_stmt = select(AuditLog).order_by(AuditLog.created_at.desc())

    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        items_stmt = items_stmt.where(condition)

    total = db.scalar(count_stmt) or 0
    offset = (query.page - 1) * query.page_size
    items = list(db.scalars(items_stmt.offset(offset).limit(query.page_size)).all())
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0

    return PaginatedAuditLogResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
    )
