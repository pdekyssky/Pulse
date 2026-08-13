import math

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationListQuery, PaginatedNotificationResponse
from app.services.exceptions import NotFoundError


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    incident_id: int | None = None,
    alert_id: int | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        incident_id=incident_id,
        alert_id=alert_id,
    )
    db.add(notification)
    return notification


def get_notification_for_user(
    db: Session,
    notification_id: int,
    user_id: int,
) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        raise NotFoundError("Notification", notification_id)
    return notification


def list_notifications_for_user(
    db: Session,
    user_id: int,
    query: NotificationListQuery,
) -> PaginatedNotificationResponse:
    conditions = [Notification.user_id == user_id]
    if query.is_read is not None:
        conditions.append(Notification.is_read.is_(query.is_read))

    count_stmt = select(func.count()).select_from(Notification)
    items_stmt = select(Notification).order_by(Notification.created_at.desc())

    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        items_stmt = items_stmt.where(condition)

    total = db.scalar(count_stmt) or 0
    offset = (query.page - 1) * query.page_size
    items = list(db.scalars(items_stmt.offset(offset).limit(query.page_size)).all())
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0

    return PaginatedNotificationResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
    )


def mark_notification_read(
    db: Session,
    notification_id: int,
    user: User,
) -> Notification:
    notification = get_notification_for_user(db, notification_id, user.id)
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_notifications_read(db: Session, user: User) -> int:
    result = db.execute(
        update(Notification)
        .where(
            Notification.user_id == user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    db.commit()
    return result.rowcount or 0


def delete_notification(
    db: Session,
    notification_id: int,
    user: User,
) -> None:
    notification = get_notification_for_user(db, notification_id, user.id)
    db.delete(notification)
    db.commit()
