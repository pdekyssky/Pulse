from tests.conftest import auth_header


def test_health_is_public(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_checks_database(client):
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["database"] == "ok"


def test_protected_endpoint_requires_authentication(client):
    response = client.get("/api/v1/incidents/")
    assert response.status_code == 401


def test_invalid_token_returns_401(client):
    response = client.get(
        "/api/v1/incidents/",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


def test_login_and_access_protected_route(client, engineer_user):
    login = client.post(
        "/api/v1/users/login",
        json={"email": engineer_user.email, "password": "secure-password-123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    response = client.get(
        "/api/v1/incidents/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_user_response_never_includes_password_hash(client, admin_user):
    response = client.get(
        f"/api/v1/users/{admin_user.id}",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 200
    body = response.json()
    assert "password" not in body
    assert "password_hash" not in body
