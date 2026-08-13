from datetime import datetime, timezone

from tests.conftest import auth_header


def _create_alert(client, user, service, **overrides):
    payload = {
        "name": "Pytest Alert",
        "severity": "high",
        "service_id": service.id,
        **overrides,
    }
    return client.post(
        "/api/v1/alerts/",
        headers=auth_header(user),
        json=payload,
    )


def test_alerts_require_authentication(client):
    assert client.get("/api/v1/alerts/").status_code == 401
    assert client.get("/api/v1/alerts/1").status_code == 401
    assert client.post("/api/v1/alerts/").status_code == 401


def test_create_alert_success(client, engineer_user, service):
    response = _create_alert(client, engineer_user, service, name="Created Alert")
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Created Alert"
    assert body["status"] == "new"
    assert body["severity"] == "high"
    assert body["service_id"] == service.id
    assert body["incident_id"] is None


def test_list_and_get_alert(client, engineer_user, service):
    created = _create_alert(
        client,
        engineer_user,
        service,
        name="Listed Alert",
    ).json()

    listed = client.get("/api/v1/alerts/", headers=auth_header(engineer_user))
    assert listed.status_code == 200
    list_body = listed.json()
    assert list_body["total"] >= 1
    assert any(item["id"] == created["id"] for item in list_body["items"])

    fetched = client.get(
        f"/api/v1/alerts/{created['id']}",
        headers=auth_header(engineer_user),
    )
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Listed Alert"


def test_acknowledge_alert_transition(client, engineer_user, service):
    alert = _create_alert(client, engineer_user, service).json()

    response = client.post(
        f"/api/v1/alerts/{alert['id']}/acknowledge",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "acknowledged"


def test_resolve_alert_transition(client, engineer_user, service):
    alert = _create_alert(client, engineer_user, service).json()

    client.post(
        f"/api/v1/alerts/{alert['id']}/acknowledge",
        headers=auth_header(engineer_user),
    )
    response = client.post(
        f"/api/v1/alerts/{alert['id']}/resolve",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "resolved"


def test_invalid_alert_transition_new_to_resolved(client, engineer_user, service):
    alert = _create_alert(client, engineer_user, service).json()

    response = client.post(
        f"/api/v1/alerts/{alert['id']}/resolve",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 400


def test_viewer_cannot_create_or_acknowledge_alerts(
    client,
    viewer_user,
    engineer_user,
    service,
):
    assert _create_alert(client, viewer_user, service).status_code == 403

    alert = _create_alert(client, engineer_user, service).json()
    response = client.post(
        f"/api/v1/alerts/{alert['id']}/acknowledge",
        headers=auth_header(viewer_user),
    )
    assert response.status_code == 403


def test_engineer_cannot_delete_alert(client, engineer_user, service):
    alert = _create_alert(client, engineer_user, service).json()
    response = client.delete(
        f"/api/v1/alerts/{alert['id']}",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 403


def test_admin_can_delete_alert(client, engineer_user, admin_user, service):
    alert = _create_alert(client, engineer_user, service).json()
    response = client.delete(
        f"/api/v1/alerts/{alert['id']}",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 204


def test_list_alerts_filter_by_status(client, engineer_user, service):
    alert = _create_alert(client, engineer_user, service).json()
    client.post(
        f"/api/v1/alerts/{alert['id']}/acknowledge",
        headers=auth_header(engineer_user),
    )

    new_alerts = client.get(
        "/api/v1/alerts/?status=new",
        headers=auth_header(engineer_user),
    ).json()
    acknowledged_alerts = client.get(
        "/api/v1/alerts/?status=acknowledged",
        headers=auth_header(engineer_user),
    ).json()

    assert all(item["status"] == "new" for item in new_alerts["items"])
    assert any(item["id"] == alert["id"] for item in acknowledged_alerts["items"])


def test_create_alert_with_incident_links_and_acknowledges(
    client,
    engineer_user,
    admin_user,
    service,
):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Alert Link Incident",
            "status": "investigating",
            "severity": "medium",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()

    response = _create_alert(
        client,
        engineer_user,
        service,
        name="Linked On Create",
        incident_id=incident["id"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["incident_id"] == incident["id"]
    assert body["status"] == "acknowledged"

    events = client.get(
        f"/api/v1/incidents/{incident['id']}/events/",
        headers=auth_header(admin_user),
    ).json()
    assert any(event["event_type"] == "alert_linked" for event in events)


def test_alert_link_creates_incident_event(client, engineer_user, admin_user, service):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Alert Link Incident",
            "status": "investigating",
            "severity": "medium",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()

    alert = _create_alert(client, engineer_user, service).json()

    linked = client.patch(
        f"/api/v1/alerts/{alert['id']}",
        headers=auth_header(engineer_user),
        json={"incident_id": incident["id"]},
    )
    assert linked.status_code == 200
    assert linked.json()["incident_id"] == incident["id"]
    assert linked.json()["status"] == "acknowledged"

    events = client.get(
        f"/api/v1/incidents/{incident['id']}/events/",
        headers=auth_header(admin_user),
    ).json()
    assert any(event["event_type"] == "alert_linked" for event in events)


def test_cannot_link_alert_to_second_incident(client, engineer_user, service):
    incident_a = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Incident A",
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()
    incident_b = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Incident B",
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()

    alert = _create_alert(client, engineer_user, service, name="Locked Alert").json()

    client.patch(
        f"/api/v1/alerts/{alert['id']}",
        headers=auth_header(engineer_user),
        json={"incident_id": incident_a["id"]},
    )

    relink = client.patch(
        f"/api/v1/alerts/{alert['id']}",
        headers=auth_header(engineer_user),
        json={"incident_id": incident_b["id"]},
    )
    assert relink.status_code == 400


def test_list_alerts_filter_by_incident_id(client, engineer_user, service):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(engineer_user),
        json={
            "title": "Filter Incident",
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()

    linked = _create_alert(
        client,
        engineer_user,
        service,
        name="Filtered Alert",
        incident_id=incident["id"],
    ).json()
    _create_alert(client, engineer_user, service, name="Unlinked Alert")

    response = client.get(
        f"/api/v1/alerts/?incident_id={incident['id']}",
        headers=auth_header(engineer_user),
    )
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == linked["id"]
