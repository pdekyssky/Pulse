from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_operator
from app.api.errors import handle_service_error
from app.db.session import get_db
from app.models.user import User
from app.schemas.incident_comment import (
    IncidentCommentCreate,
    IncidentCommentCreateBody,
    IncidentCommentResponse,
    IncidentCommentUpdate,
)
from app.services import incident_comment_service

router = APIRouter()


@router.get("", response_model=list[IncidentCommentResponse])
def list_incident_comments(
    incident_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return incident_comment_service.get_comments_for_incident(db, incident_id)
    except Exception as error:
        handle_service_error(error)


@router.post("", response_model=IncidentCommentResponse, status_code=status.HTTP_201_CREATED)
def create_incident_comment(
    incident_id: int,
    data: IncidentCommentCreateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return incident_comment_service.create_incident_comment(
            db,
            IncidentCommentCreate(
                incident_id=incident_id,
                author_id=current_user.id,
                content=data.content,
            ),
        )
    except Exception as error:
        handle_service_error(error)


@router.patch("/{comment_id}", response_model=IncidentCommentResponse)
def update_incident_comment(
    incident_id: int,
    comment_id: int,
    data: IncidentCommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        return incident_comment_service.update_incident_comment(
            db,
            incident_id,
            comment_id,
            data,
            actor=current_user,
        )
    except Exception as error:
        handle_service_error(error)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident_comment(
    incident_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    try:
        incident_comment_service.delete_incident_comment(
            db,
            incident_id,
            comment_id,
            actor=current_user,
        )
    except Exception as error:
        handle_service_error(error)
