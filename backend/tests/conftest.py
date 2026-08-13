import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.core.user_role import UserRole
from app.db.database import engine
from app.db.session import get_db
from app.main import app
from app.models.service import Service
from app.models.user import User


@pytest.fixture()
def db() -> Session:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db: Session):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db: Session) -> User:
    user = User(
        name="Test Admin",
        email="pytest.admin@pulse.io",
        role=UserRole.admin.value,
        is_active=True,
        password_hash=hash_password("secure-password-123"),
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture()
def engineer_user(db: Session) -> User:
    user = User(
        name="Test Engineer",
        email="pytest.engineer@pulse.io",
        role=UserRole.engineer.value,
        is_active=True,
        password_hash=hash_password("secure-password-123"),
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture()
def viewer_user(db: Session) -> User:
    user = User(
        name="Test Viewer",
        email="pytest.viewer@pulse.io",
        role=UserRole.viewer.value,
        is_active=True,
        password_hash=hash_password("secure-password-123"),
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture()
def service(db: Session, admin_user: User) -> Service:
    service = Service(
        name="Pytest Service",
        description="test",
        status="operational",
        owner_id=admin_user.id,
        uptime=99.99,
    )
    db.add(service)
    db.flush()
    return service


def auth_header(user: User) -> dict[str, str]:
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}
