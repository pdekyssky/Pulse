from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.errors import handle_service_error
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import (
    MarkAllReadResponse,
    NotificationListQuery,
    NotificationResponse,
    PaginatedNotificationResponse,
)
from app.services import notification_service

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedNotificationResponse)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    is_read: bool | None = None,
):
    query = NotificationListQuery(page=page, page_size=page_size, is_read=is_read)
    return notification_service.list_notifications_for_user(db, current_user.id, query)


@router.patch("/read-all", response_model=MarkAllReadResponse)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_count = notification_service.mark_all_notifications_read(db, current_user)
    return MarkAllReadResponse(updated_count=updated_count)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return notification_service.get_notification_for_user(
            db,
            notification_id,
            current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return notification_service.mark_notification_read(
            db,
            notification_id,
            current_user,
        )
    except Exception as error:
        handle_service_error(error)


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        notification_service.delete_notification(db, notification_id, current_user)
    except Exception as error:
        handle_service_error(error)
