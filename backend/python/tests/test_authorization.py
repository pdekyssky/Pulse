from tests.conftest import auth_header


def test_engineer_cannot_access_audit_logs(client, engineer_user):
    response = client.get("/api/v1/audit-logs/", headers=auth_header(engineer_user))
    assert response.status_code == 403


def test_viewer_cannot_access_audit_logs(client, viewer_user):
    response = client.get("/api/v1/audit-logs/", headers=auth_header(viewer_user))
    assert response.status_code == 403


def test_admin_can_access_audit_logs(client, admin_user):
    response = client.get("/api/v1/audit-logs/", headers=auth_header(admin_user))
    assert response.status_code == 200


def test_engineer_cannot_delete_incidents(client, engineer_user):
    response = client.delete("/api/v1/incidents/1", headers=auth_header(engineer_user))
    assert response.status_code == 403


def test_viewer_cannot_create_incidents(client, viewer_user, service):
    response = client.post(
        "/api/v1/incidents/",
        headers=auth_header(viewer_user),
        json={
            "title": "Blocked",
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": "2026-08-13T12:00:00Z",
        },
    )
    assert response.status_code == 403
