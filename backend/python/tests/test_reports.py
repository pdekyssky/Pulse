from tests.conftest import auth_header


def test_reports_requires_authentication(client):
    response = client.get("/api/v1/reports")
    assert response.status_code == 401


def test_reports_list_returns_expected_shape(client, engineer_user, service):
    response = client.get("/api/v1/reports", headers=auth_header(engineer_user))
    assert response.status_code == 200
    body = response.json()

    assert "items" in body
    assert "page" in body
    assert "page_size" in body
    assert "total" in body
    assert "total_pages" in body
    assert "stats" in body
    assert body["stats"]["total"] >= 1
    assert len(body["items"]) >= 1

    first = body["items"][0]
    assert "id" in first
    assert "name" in first
    assert "type" in first
    assert "metrics" in first
    assert first["status"] == "completed"


def test_reports_filter_by_type(client, engineer_user):
    response = client.get(
        "/api/v1/reports?type=incident_summary",
        headers=auth_header(engineer_user),
    )
    body = response.json()

    assert response.status_code == 200
    assert body["total"] >= 1
    assert all(item["type"] == "incident_summary" for item in body["items"])


def test_reports_search(client, engineer_user):
    response = client.get(
        "/api/v1/reports?search=Incident",
        headers=auth_header(engineer_user),
    )
    body = response.json()

    assert response.status_code == 200
    assert body["total"] >= 1


def test_reports_scheduled_status_filter_returns_empty(client, engineer_user):
    response = client.get(
        "/api/v1/reports?status=scheduled",
        headers=auth_header(engineer_user),
    )
    body = response.json()

    assert response.status_code == 200
    assert body["total"] == 0
    assert body["stats"]["scheduled"] == 0


def test_get_report_by_id(client, engineer_user):
    listed = client.get("/api/v1/reports", headers=auth_header(engineer_user)).json()
    report_id = listed["items"][0]["id"]

    response = client.get(f"/api/v1/reports/{report_id}", headers=auth_header(engineer_user))
    assert response.status_code == 200
    assert response.json()["id"] == report_id


def test_reports_viewer_can_access(client, viewer_user):
    response = client.get("/api/v1/reports", headers=auth_header(viewer_user))
    assert response.status_code == 200
