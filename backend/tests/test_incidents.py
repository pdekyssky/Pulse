from datetime import datetime, timezone

from tests.conftest import auth_header


def test_create_incident(client, engineer_user, service):
    response = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Pytest Incident",
            "status": "investigating",
            "severity": "high",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Pytest Incident"
    assert body["created_by_id"] == engineer_user.id
    assert body["severity"] == "high"


def test_invalid_status_transition_returns_400(client, engineer_user, service):
    create = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Transition Incident",
            "status": "investigating",
            "severity": "medium",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    incident_id = create.json()["id"]

    response = client.patch(
        f"/api/v1/incidents/{incident_id}",
        headers=auth_header(engineer_user),
        json={"status": "resolved"},
    )
    assert response.status_code == 400


def test_service_health_recalculates_on_incident_create(client, engineer_user, service, admin_user):
    before = client.get(
        f"/api/v1/services/{service.id}",
        headers=auth_header(admin_user),
    ).json()
    assert before["status"] == "operational"

    client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Health Incident",
            "status": "investigating",
            "severity": "critical",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    after = client.get(
        f"/api/v1/services/{service.id}",
        headers=auth_header(admin_user),
    ).json()
    assert after["status"] == "major_outage"
