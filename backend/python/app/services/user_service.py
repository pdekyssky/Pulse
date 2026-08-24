from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit_actions import AuditAction, AuditResourceType
from app.core.security import hash_password
from app.core.user_role import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserRegister, UserUpdate
from app.services.audit_service import create_audit_log
from app.services.exceptions import ForbiddenError, NotFoundError


def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User", user_id)
    return user


def get_user_by_email(db: Session, email: str) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise NotFoundError("User", email)
    return user


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.name)).all())


def _count_active_admins(db: Session) -> int:
    return db.scalar(
        select(func.count())
        .select_from(User)
        .where(User.role == UserRole.admin.value, User.is_active.is_(True))
    ) or 0


def _ensure_not_last_admin(db: Session, user: User, *, action: str) -> None:
    if user.role == UserRole.admin.value and user.is_active and _count_active_admins(db) <= 1:
        raise ValueError(f"Cannot {action} the last active administrator")


def register_user(db: Session, data: UserRegister) -> User:
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.viewer.value,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("A user with this email already exists") from error
    db.refresh(user)
    return user


def create_user(db: Session, data: UserCreate, actor_id: int) -> User:
    user_data = data.model_dump(exclude={"password"}, mode="json")
    user = User(**user_data, password_hash=hash_password(data.password))
    db.add(user)
    try:
        db.flush()
        create_audit_log(
            db,
            user_id=actor_id,
            action=AuditAction.user_created,
            resource_type=AuditResourceType.user,
            resource_id=user.id,
            description=f'User "{user.email}" created with role {user.role}.',
        )
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("A user with this email already exists") from error
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user_id: int,
    data: UserUpdate,
    actor: User,
) -> User:
    user = get_user_by_id(db, user_id)
    update_data = data.model_dump(exclude_unset=True, exclude={"password"})
    old_role = user.role
    was_active = user.is_active

    if "role" in update_data and update_data["role"] != user.role:
        if user.role == UserRole.admin.value and user.is_active:
            _ensure_not_last_admin(db, user, action="change the role of")

    if "is_active" in update_data and update_data["is_active"] is False and user.is_active:
        if user.role == UserRole.admin.value:
            _ensure_not_last_admin(db, user, action="deactivate")

    if data.password is not None:
        user.password_hash = hash_password(data.password)

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        if "role" in update_data and update_data["role"] != old_role:
            create_audit_log(
                db,
                user_id=actor.id,
                action=AuditAction.user_role_changed,
                resource_type=AuditResourceType.user,
                resource_id=user.id,
                description=(
                    f'User "{user.email}" role changed from {old_role} '
                    f'to {user.role}.'
                ),
            )
        if "is_active" in update_data and update_data["is_active"] is False and was_active:
            create_audit_log(
                db,
                user_id=actor.id,
                action=AuditAction.user_deactivated,
                resource_type=AuditResourceType.user,
                resource_id=user.id,
                description=f'User "{user.email}" deactivated.',
            )
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("A user with this email already exists") from error
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: int, actor: User) -> None:
    user = get_user_by_id(db, user_id)

    if actor.id == user_id:
        raise ForbiddenError("Cannot deactivate your own account")

    if user.is_active and user.role == UserRole.admin.value:
        _ensure_not_last_admin(db, user, action="deactivate")

    user.is_active = False
    create_audit_log(
        db,
        user_id=actor.id,
        action=AuditAction.user_deactivated,
        resource_type=AuditResourceType.user,
        resource_id=user.id,
        description=f'User "{user.email}" deactivated.',
    )
    db.commit()
