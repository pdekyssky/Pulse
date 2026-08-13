from datetime import datetime, timezone

from tests.conftest import auth_header


def _assign_incident(client, admin_user, engineer_user, service):
    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(admin_user),
        json={
            "title": "Assignment Incident",
            "status": "investigating",
            "severity": "medium",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()
    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(admin_user),
        json={"assigned_to_id": engineer_user.id},
    )
    return incident


def test_notifications_require_authentication(client):
    assert client.get("/api/v1/notifications/").status_code == 401
    assert client.get("/api/v1/notifications/1").status_code == 401
    assert client.patch("/api/v1/notifications/1/read").status_code == 401
    assert client.patch("/api/v1/notifications/read-all").status_code == 401


def test_list_notifications_for_authenticated_user(
    client,
    admin_user,
    engineer_user,
    service,
):
    _assign_incident(client, admin_user, engineer_user, service)

    response = client.get(
        "/api/v1/notifications/",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert len(body["items"]) >= 1
    assert body["page"] == 1
    assert "total_pages" in body


def test_notification_user_isolation(client, admin_user, engineer_user, service):
    _assign_incident(client, admin_user, engineer_user, service)

    engineer_notes = client.get(
        "/api/v1/notifications/",
        headers=auth_header(engineer_user),
    ).json()
    admin_notes = client.get(
        "/api/v1/notifications/",
        headers=auth_header(admin_user),
    ).json()

    assert engineer_notes["total"] >= 1
    assert all(item["user_id"] == engineer_user.id for item in engineer_notes["items"])
    assert admin_notes["total"] == 0


def test_get_notification_by_id(client, admin_user, engineer_user, service):
    _assign_incident(client, admin_user, engineer_user, service)

    listed = client.get(
        "/api/v1/notifications/",
        headers=auth_header(engineer_user),
    ).json()
    notification_id = listed["items"][0]["id"]

    response = client.get(
        f"/api/v1/notifications/{notification_id}",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    assert response.json()["id"] == notification_id
    assert response.json()["user_id"] == engineer_user.id


def test_cannot_get_another_users_notification(
    client,
    admin_user,
    engineer_user,
    service,
):
    _assign_incident(client, admin_user, engineer_user, service)

    notification_id = client.get(
        "/api/v1/notifications/",
        headers=auth_header(engineer_user),
    ).json()["items"][0]["id"]

    response = client.get(
        f"/api/v1/notifications/{notification_id}",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 404


def test_mark_notification_as_read(client, admin_user, engineer_user, service):
    _assign_incident(client, admin_user, engineer_user, service)

    notification_id = client.get(
        "/api/v1/notifications/?is_read=false",
        headers=auth_header(engineer_user),
    ).json()["items"][0]["id"]

    response = client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    unread = client.get(
        "/api/v1/notifications/?is_read=false",
        headers=auth_header(engineer_user),
    ).json()
    assert all(item["id"] != notification_id for item in unread["items"])


def test_cannot_mark_another_users_notification_read(
    client,
    admin_user,
    engineer_user,
    service,
):
    _assign_incident(client, admin_user, engineer_user, service)

    notification_id = client.get(
        "/api/v1/notifications/",
        headers=auth_header(engineer_user),
    ).json()["items"][0]["id"]

    response = client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=auth_header(admin_user),
    )
    assert response.status_code == 404


def test_mark_all_notifications_as_read(client, admin_user, engineer_user, service):
    _assign_incident(client, admin_user, engineer_user, service)

    incident = client.post(
        "/api/v1/incidents/",
        headers=auth_header(admin_user),
        json={
            "title": "Second Assignment",
            "status": "investigating",
            "severity": "low",
            "service_id": service.id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    ).json()
    client.patch(
        f"/api/v1/incidents/{incident['id']}",
        headers=auth_header(admin_user),
        json={"assigned_to_id": engineer_user.id},
    )

    unread_before = client.get(
        "/api/v1/notifications/?is_read=false",
        headers=auth_header(engineer_user),
    ).json()["total"]
    assert unread_before >= 2

    response = client.patch(
        "/api/v1/notifications/read-all",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 200
    assert response.json()["updated_count"] >= 2

    unread_after = client.get(
        "/api/v1/notifications/?is_read=false",
        headers=auth_header(engineer_user),
    ).json()["total"]
    assert unread_after == 0


def test_filter_notifications_by_read_status(client, admin_user, engineer_user, service):
    _assign_incident(client, admin_user, engineer_user, service)

    notification_id = client.get(
        "/api/v1/notifications/?is_read=false",
        headers=auth_header(engineer_user),
    ).json()["items"][0]["id"]

    client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=auth_header(engineer_user),
    )

    unread = client.get(
        "/api/v1/notifications/?is_read=false",
        headers=auth_header(engineer_user),
    ).json()
    read = client.get(
        "/api/v1/notifications/?is_read=true",
        headers=auth_header(engineer_user),
    ).json()

    assert all(item["is_read"] is False for item in unread["items"])
    assert any(item["id"] == notification_id for item in read["items"])
    assert all(item["is_read"] is True for item in read["items"])


def test_get_nonexistent_notification_returns_404(client, engineer_user):
    response = client.get(
        "/api/v1/notifications/999999",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 404


def test_mark_nonexistent_notification_returns_404(client, engineer_user):
    response = client.patch(
        "/api/v1/notifications/999999/read",
        headers=auth_header(engineer_user),
    )
    assert response.status_code == 404


def test_notification_pagination(client, admin_user, engineer_user, service):
    for index in range(3):
        incident = client.post(
            "/api/v1/incidents/",
            headers=auth_header(admin_user),
            json={
                "title": f"Paginated Assignment {index}",
                "status": "investigating",
                "severity": "low",
                "service_id": service.id,
                "started_at": datetime.now(timezone.utc).isoformat(),
            },
        ).json()
        client.patch(
            f"/api/v1/incidents/{incident['id']}",
            headers=auth_header(admin_user),
            json={"assigned_to_id": engineer_user.id},
        )

    page_one = client.get(
        "/api/v1/notifications/?page=1&page_size=2",
        headers=auth_header(engineer_user),
    ).json()
    assert len(page_one["items"]) == 2
    assert page_one["total"] >= 3
    assert page_one["total_pages"] >= 2
