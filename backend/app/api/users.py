from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_operator
from app.api.errors import handle_service_error
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserCreate, UserRegister, UserResponse, UserUpdate
from app.services import auth_service, user_service

router = APIRouter()

INVALID_CREDENTIALS_MESSAGE = "Invalid email or password"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    try:
        return user_service.register_user(db, data)
    except Exception as error:
        handle_service_error(error)


@router.post("/login", response_model=LoginResponse)
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.login_user(db, data.email, data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_MESSAGE,
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)
    return LoginResponse(access_token=access_token, user=user)


protected_router = APIRouter(dependencies=[Depends(get_current_user)])


@protected_router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_operator),
):
    return user_service.list_users(db)


@protected_router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_operator),
):
    try:
        return user_service.get_user_by_id(db, user_id)
    except Exception as error:
        handle_service_error(error)


@protected_router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return user_service.create_user(db, data, actor_id=current_user.id)
    except Exception as error:
        handle_service_error(error)


@protected_router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return user_service.update_user(db, user_id, data, actor=current_user)
    except Exception as error:
        handle_service_error(error)


@protected_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        user_service.deactivate_user(db, user_id, actor=current_user)
    except Exception as error:
        handle_service_error(error)


router.include_router(protected_router)
