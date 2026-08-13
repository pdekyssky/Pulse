from datetime import datetime, timedelta, timezone

from tests.conftest import auth_header


def test_analytics_requires_authentication(client):
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 401


def test_analytics_overview_returns_expected_shape(client, engineer_user, service):
    response = client.get(
        "/api/v1/analytics/overview",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    body = response.json()

    assert body["date_range"] == "7d"
    assert body["service_id"] is None
    assert "overall_uptime" in body["kpis"]
    assert "average_response_time" in body["kpis"]
    assert "total_incidents" in body["kpis"]
    assert "mttr" in body["kpis"]
    assert "alert_volume" in body["kpis"]
    assert len(body["uptime_series"]) == 7
    assert len(body["incident_trend"]) == 7
    assert len(body["response_time_series"]) == 7
    assert isinstance(body["service_performance"], list)


def test_analytics_incident_trend_reflects_created_incidents(client, engineer_user, service):
    client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Analytics Incident",
            "status": "investigating",
            "severity": "critical",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = client.get(
        "/api/v1/analytics/overview",
        headers=auth_header(engineer_user),
    )
    body = response.json()

    assert body["kpis"]["total_incidents"] >= 1
    today = datetime.now(timezone.utc).date().isoformat()
    today_trend = next(item for item in body["incident_trend"] if item["date"] == today)
    assert today_trend["total"] >= 1
    assert today_trend["critical"] >= 1


def test_analytics_filters_by_service_id(client, engineer_user, admin_user, service, db):
    other_service = service.__class__(
        name="Analytics Other Service",
        description="other",
        status="operational",
        owner_id=admin_user.id,
        uptime=98.5,
    )
    db.add(other_service)
    db.flush()

    client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Primary Service Incident",
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
            "title": "Other Service Incident",
            "status": "investigating",
            "severity": "critical",
            "service_id": other_service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = client.get(
        f"/api/v1/analytics/overview?service_id={service.id}",
        headers=auth_header(engineer_user),
    )
    body = response.json()

    assert body["service_id"] == service.id
    assert body["kpis"]["total_incidents"] == 1
    assert len(body["service_performance"]) == 1
    assert body["service_performance"][0]["service_id"] == service.id


def test_analytics_date_range_controls_series_length(client, engineer_user):
    response = client.get(
        "/api/v1/analytics/overview?date_range=30d",
        headers=auth_header(engineer_user),
    )
    body = response.json()

    assert body["date_range"] == "30d"
    assert len(body["uptime_series"]) == 30
    assert len(body["incident_trend"]) == 30
    assert len(body["response_time_series"]) == 30


def test_analytics_mttr_for_resolved_incident(client, engineer_user, service):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "MTTR Incident",
            "status": "investigating",
            "severity": "medium",
            "service_id": service.id,
            "started_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
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

    response = client.get(
        "/api/v1/analytics/overview",
        headers=auth_header(engineer_user),
    )
    assert response.json()["kpis"]["mttr"] != "0m"


def test_analytics_viewer_can_access(client, viewer_user):
    response = client.get(
        "/api/v1/analytics/overview",
        headers=auth_header(viewer_user),
    )
    assert response.status_code == 200
