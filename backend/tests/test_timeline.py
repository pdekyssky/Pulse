from datetime import datetime, timezone

from tests.conftest import auth_header


def test_timeline_requires_authentication(client):
    response = client.get("/api/v1/timeline/")
    assert response.status_code == 401


def test_timeline_includes_incident_created(client, engineer_user, service):
    client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Timeline Incident",
            "status": "investigating",
            "severity": "high",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = client.get("/api/v1/timeline/", headers=auth_header(engineer_user))
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    types = {item["type"] for item in body["items"]}
    assert "incident_created" in types
    assert body["stats"]["incidents"] >= 1


def test_timeline_includes_alert_triggered(client, engineer_user, service):
    client.post(
        "/api/v1/alerts/",
        headers=auth_header(engineer_user),
        json={
            "name": "Timeline Alert",
            "severity": "medium",
            "service_id": service.id,
        },
    )

    response = client.get("/api/v1/timeline/", headers=auth_header(engineer_user))
    assert response.status_code == 200
    body = response.json()
    assert any(item["type"] == "alert_triggered" for item in body["items"])
    assert body["stats"]["alerts"] >= 1


def test_timeline_filters_by_service_id(client, engineer_user, admin_user, service, db):
    other_service = service.__class__(
        name="Other Service",
        description="other",
        status="operational",
        owner_id=admin_user.id,
        uptime=99.0,
    )
    db.add(other_service)
    db.flush()

    client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Service A Incident",
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Service B Incident",
            "status": "investigating",
            "severity": "low",
            "service_id": other_service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = client.get(
        f"/api/v1/timeline/?service_id={service.id}",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    body = response.json()
    assert all(
        item.get("service_id") == service.id
        for item in body["items"]
        if item.get("service_id") is not None
    )
    assert any(item["title"] == "Service A Incident" for item in body["items"])
    assert not any(item["title"] == "Service B Incident" for item in body["items"])


def test_timeline_filters_by_type(client, engineer_user, service):
    client.post(
        "/api/v1/alerts/",
        headers=auth_header(engineer_user),
        json={
            "name": "Type Filter Alert",
            "severity": "low",
            "service_id": service.id,
        },
    )

    response = client.get(
        "/api/v1/timeline/?type=alert_triggered",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert all(item["type"] == "alert_triggered" for item in body["items"])


def test_timeline_pagination(client, engineer_user, service):
    for index in range(3):
        client.post(
            "/api/v1/incidents/",
            headers=auth_header(engineer_user),
            json={
                "title": f"Paginated Incident {index}",
                "status": "investigating",
                "severity": "low",
                "service_id": service.id,
                "started_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    page_one = client.get(
        "/api/v1/timeline/?page=1&page_size=2",
        headers=auth_header(engineer_user),
    ).json()
    assert len(page_one["items"]) == 2
    assert page_one["total"] >= 3
    assert page_one["total_pages"] >= 2


def test_timeline_includes_incident_event_as_updated(client, engineer_user, service):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Event Timeline Incident",
            "status": "investigating",
            "severity": "medium",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()

    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(engineer_user),
        json={"status": "identified"},
    )

    response = client.get("/api/v1/timeline/", headers=auth_header(engineer_user))
    assert response.status_code == 200
    types = {item["type"] for item in response.json()["items"]}
    assert "incident_updated" in types


def test_timeline_service_recovered_on_resolve(client, engineer_user, admin_user, service):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Recovery Incident",
            "status": "investigating",
            "severity": "critical",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()

    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(engineer_user),
        json={"status": "identified"},
    )
    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(engineer_user),
        json={"status": "monitoring"},
    )
    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(engineer_user),
        json={"status": "resolved"},
    )

    response = client.get("/api/v1/timeline/", headers=auth_header(admin_user))
    types = {item["type"] for item in response.json()["items"]}
    assert "service_degraded" in types
    assert "incident_resolved" in types
    assert "service_recovered" in types
