from tests.conftest import auth_header


def test_cors_allows_local_frontend_origin(client):
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "authorization" in response.headers.get("access-control-allow-headers", "").lower()


def test_auth_login_returns_token_and_user(client, engineer_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": engineer_user.email, "password": "secure-password-123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == engineer_user.email
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_auth_me_returns_current_user(client, engineer_user):
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == engineer_user.id
    assert body["email"] == engineer_user.email


def test_collection_endpoints_work_without_trailing_slash(client, engineer_user):
    token = auth_header(engineer_user)
    endpoints = [
        "/api/v1/incidents",
        "/api/v1/services",
        "/api/v1/alerts",
        "/api/v1/notifications",
        "/api/v1/timeline",
    ]

    for path in endpoints:
        response = client.get(path, headers=token)
        assert response.status_code == 200, path
        assert response.headers.get("location") is None
