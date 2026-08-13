from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_operator
from app.api.errors import handle_service_error
from app.db.session import get_db
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from app.services import service_service

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    return service_service.list_services(db)


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    try:
        return service_service.get_service_by_id(db, service_id)
    except Exception as error:
        handle_service_error(error)


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return service_service.create_service(db, data, actor_id=current_user.id)
    except Exception as error:
        handle_service_error(error)


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return service_service.update_service(
            db,
            service_id,
            data,
            actor_id=current_user.id,
        )
    except Exception as error:
        handle_service_error(error)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        service_service.delete_service(db, service_id, actor_id=current_user.id)
    except Exception as error:
        handle_service_error(error)
