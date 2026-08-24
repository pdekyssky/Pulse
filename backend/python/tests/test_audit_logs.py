from datetime import datetime, timedelta, timezone

from tests.conftest import auth_header

SENSITIVE_FIELDS = frozenset(
    {
        "password",
        "password_hash",
        "jwt_secret_key",
        "access_token",
        "secret",
    }
)


def _create_incident(client, user, service, title="Audited Incident"):
    return client.post(
        "/api/v1/incidents/",
        headers=auth_header(user),
        json={
            "title": title,
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )


def test_audit_logs_require_authentication(client):
    assert client.get("/api/v1/audit-logs/").status_code == 401
    assert client.get("/api/v1/audit-logs/1").status_code == 401


def test_admin_can_list_audit_logs(client, admin_user):
    response = client.get("/api/v1/audit-logs/", headers=auth_header(admin_user))
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert "page" in body
    assert "total_pages" in body


def test_engineer_cannot_access_audit_logs(client, engineer_user):
    response = client.get("/api/v1/audit-logs/", headers=auth_header(engineer_user))
    assert response.status_code == 403


def test_viewer_cannot_access_audit_logs(client, viewer_user):
    response = client.get("/api/v1/audit-logs/", headers=auth_header(viewer_user))
    assert response.status_code == 403


def test_incident_creation_writes_audit_log(client, engineer_user, admin_user, service):
    _create_incident(client, engineer_user, service)

    logs = client.get("/api/v1/audit-logs/", headers=auth_header(admin_user)).json()
    assert logs["total"] >= 1
    latest = logs["items"][0]
    assert latest["action"] == "incident.created"
    assert latest["user_id"] == engineer_user.id
    assert latest["resource_type"] == "incident"


def test_incident_update_writes_audit_log(client, engineer_user, admin_user, service):
    incident = _create_incident(client, engineer_user, service).json()

    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(engineer_user),
        json={"severity": "high"},
    )

    logs = client.get(
        "/api/v1/audit-logs/?action=incident.updated",
        headers=auth_header(admin_user),
    ).json()
    assert logs["total"] >= 1
    assert any(item["resource_id"] == incident["id"] for item in logs["items"])


def test_incident_deletion_writes_audit_log(
    client,
    engineer_user,
    admin_user,
    service,
):
    incident = _create_incident(client, engineer_user, service, title="Delete Me").json()

    response = client.delete(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 204

    logs = client.get(
        "/api/v1/audit-logs/?action=incident.deleted",
        headers=auth_header(admin_user),
    ).json()
    assert logs["total"] >= 1
    assert any(item["resource_id"] == incident["id"] for item in logs["items"])


def test_alert_creation_writes_audit_log(client, engineer_user, admin_user, service):
    client.post(
        "/api/v1/alerts/",
        headers=auth_header(engineer_user),
        json={
            "name": "Audited Alert",
            "severity": "medium",
            "service_id": service.id,
        },
    )

    logs = client.get(
        "/api/v1/audit-logs/?action=alert.created&resource_type=alert",
        headers=auth_header(admin_user),
    ).json()
    assert logs["total"] >= 1
    assert logs["items"][0]["user_id"] == engineer_user.id


def test_filter_audit_logs_by_user_id(client, engineer_user, admin_user, service):
    _create_incident(client, engineer_user, service, title="User Filter Incident")

    logs = client.get(
        f"/api/v1/audit-logs/?user_id={engineer_user.id}",
        headers=auth_header(admin_user),
    ).json()
    assert logs["total"] >= 1
    assert all(item["user_id"] == engineer_user.id for item in logs["items"])


def test_filter_audit_logs_by_resource_type(client, engineer_user, admin_user, service):
    _create_incident(client, engineer_user, service, title="Resource Filter Incident")

    logs = client.get(
        "/api/v1/audit-logs/?resource_type=incident",
        headers=auth_header(admin_user),
    ).json()
    assert logs["total"] >= 1
    assert all(item["resource_type"] == "incident" for item in logs["items"])


def test_filter_audit_logs_by_date_range(client, engineer_user, admin_user, service):
    _create_incident(client, engineer_user, service, title="Date Filter Incident")

    now = datetime.now(timezone.utc)
    created_from = (now - timedelta(hours=1)).isoformat()
    created_to = (now + timedelta(hours=1)).isoformat()

    logs = client.get(
        "/api/v1/audit-logs/",
        headers=auth_header(admin_user),
        params={
            "created_from": created_from,
            "created_to": created_to,
        },
    ).json()
    assert logs["total"] >= 1


def test_audit_log_pagination(client, engineer_user, admin_user, service):
    for index in range(3):
        _create_incident(client, engineer_user, service, title=f"Paginated Incident {index}")

    page_one = client.get(
        "/api/v1/audit-logs/?page=1&page_size=2",
        headers=auth_header(admin_user),
    ).json()
    assert len(page_one["items"]) == 2
    assert page_one["total"] >= 3
    assert page_one["total_pages"] >= 2


def test_get_audit_log_by_id(client, engineer_user, admin_user, service):
    _create_incident(client, engineer_user, service, title="Get By ID Incident")

    listed = client.get("/api/v1/audit-logs/", headers=auth_header(admin_user)).json()
    audit_log_id = listed["items"][0]["id"]

    response = client.get(
        f"/api/v1/audit-logs/{audit_log_id}",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 200
    assert response.json()["id"] == audit_log_id


def test_get_nonexistent_audit_log_returns_404(client, admin_user):
    response = client.get(
        "/api/v1/audit-logs/999999",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 404


def test_audit_log_response_excludes_sensitive_fields(
    client,
    engineer_user,
    admin_user,
    service,
):
    _create_incident(client, engineer_user, service)

    item = client.get("/api/v1/audit-logs/", headers=auth_header(admin_user)).json()["items"][0]
    assert SENSITIVE_FIELDS.isdisjoint(item.keys())
    assert SENSITIVE_FIELDS.isdisjoint(str(item).lower())

    for value in item.values():
        if isinstance(value, str):
            lowered = value.lower()
            assert "password_hash" not in lowered
            assert "jwt_secret" not in lowered
