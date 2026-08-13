from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit_actions import AuditAction, AuditResourceType
from app.core.user_role import UserRole
from app.models.incident import Incident
from app.models.incident_comment import IncidentComment
from app.models.user import User
from app.schemas.incident_comment import IncidentCommentCreate, IncidentCommentUpdate
from app.services.audit_service import create_audit_log
from app.services.exceptions import ForbiddenError, NotFoundError
from app.services.incident_event_service import record_incident_event


def _get_incident_by_id(db: Session, incident_id: int) -> Incident:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise NotFoundError("Incident", incident_id)
    return incident


def get_comment_for_incident(
    db: Session,
    incident_id: int,
    comment_id: int,
) -> IncidentComment:
    _get_incident_by_id(db, incident_id)

    comment = db.get(IncidentComment, comment_id)
    if comment is None or comment.incident_id != incident_id:
        raise NotFoundError("IncidentComment", comment_id)
    return comment


def _ensure_can_modify_comment(comment: IncidentComment, actor: User) -> None:
    if actor.role == UserRole.admin.value:
        return

    if comment.author_id != actor.id:
        raise ForbiddenError("Insufficient permissions")


def get_comments_for_incident(db: Session, incident_id: int) -> list[IncidentComment]:
    _get_incident_by_id(db, incident_id)

    return list(
        db.scalars(
            select(IncidentComment)
            .where(IncidentComment.incident_id == incident_id)
            .order_by(IncidentComment.created_at)
        ).all()
    )


def create_incident_comment(db: Session, data: IncidentCommentCreate) -> IncidentComment:
    _get_incident_by_id(db, data.incident_id)

    comment = IncidentComment(
        incident_id=data.incident_id,
        author_id=data.author_id,
        content=data.content,
    )
    db.add(comment)
    db.flush()

    record_incident_event(
        db,
        incident_id=data.incident_id,
        author_id=data.author_id,
        event_type="comment",
        message="Comment added.",
    )

    create_audit_log(
        db,
        user_id=data.author_id,
        action=AuditAction.comment_created,
        resource_type=AuditResourceType.comment,
        resource_id=comment.id,
        description=f"Comment added to incident #{data.incident_id}.",
    )

    db.commit()
    db.refresh(comment)
    return comment


def update_incident_comment(
    db: Session,
    incident_id: int,
    comment_id: int,
    data: IncidentCommentUpdate,
    actor: User,
) -> IncidentComment:
    comment = get_comment_for_incident(db, incident_id, comment_id)
    _ensure_can_modify_comment(comment, actor)

    comment.content = data.content

    record_incident_event(
        db,
        incident_id=incident_id,
        author_id=actor.id,
        event_type="comment_edited",
        message="Comment edited.",
    )

    create_audit_log(
        db,
        user_id=actor.id,
        action=AuditAction.comment_updated,
        resource_type=AuditResourceType.comment,
        resource_id=comment.id,
        description=f"Comment #{comment.id} updated on incident #{incident_id}.",
    )

    db.commit()
    db.refresh(comment)
    return comment


def delete_incident_comment(
    db: Session,
    incident_id: int,
    comment_id: int,
    actor: User,
) -> None:
    comment = get_comment_for_incident(db, incident_id, comment_id)
    _ensure_can_modify_comment(comment, actor)

    record_incident_event(
        db,
        incident_id=incident_id,
        author_id=actor.id,
        event_type="comment_deleted",
        message="Comment deleted.",
    )

    create_audit_log(
        db,
        user_id=actor.id,
        action=AuditAction.comment_deleted,
        resource_type=AuditResourceType.comment,
        resource_id=comment.id,
        description=f"Comment #{comment.id} deleted from incident #{incident_id}.",
    )

    db.delete(comment)
    db.commit()
