from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.scalar(select(User).where(User.email == email))

    if user is None or user.password_hash is None or not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def login_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate credentials and return the user, or None if login fails."""
    return authenticate_user(db, email, password)
