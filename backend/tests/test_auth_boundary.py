TEST_CLINIC_ID = "11111111-1111-1111-1111-111111111111"


async def test_protected_routes_require_actor_context(client) -> None:
    response = await client.get("/api/v1/patients")

    assert response.status_code == 401
    assert response.json()["code"] == "unauthorized"


async def test_stub_auth_headers_allow_protected_read_routes(client) -> None:
    response = await client.get(
        "/api/v1/patients",
        headers={
            "X-HealthSphere-Actor-Id": "staff-123",
            "X-HealthSphere-Actor-Role": "staff",
            "X-HealthSphere-Clinic-Id": TEST_CLINIC_ID,
        },
    )

    assert response.status_code == 200
    assert response.json() == []


async def test_invalid_stub_role_returns_bad_request(client) -> None:
    response = await client.get(
        "/api/v1/patients",
        headers={
            "X-HealthSphere-Actor-Id": "staff-123",
            "X-HealthSphere-Actor-Role": "visitor",
        },
    )

    assert response.status_code == 400
    assert response.json()["code"] == "bad_request"


async def test_protected_read_routes_require_clinic_scope_header(client) -> None:
    response = await client.get(
        "/api/v1/patients",
        headers={
            "X-HealthSphere-Actor-Id": "staff-123",
            "X-HealthSphere-Actor-Role": "staff",
        },
    )

    assert response.status_code == 403
    assert response.json()["message"] == "Clinic scope is required for this route."


async def test_clerk_mode_does_not_fall_back_to_stub_auth(client) -> None:
    from app.core.config import settings

    original_auth_mode = settings.auth_mode
    settings.auth_mode = "clerk"

    try:
        response = await client.get(
            "/api/v1/patients",
            headers={"X-HealthSphere-Actor-Id": "staff-123"},
        )
    finally:
        settings.auth_mode = original_auth_mode

    assert response.status_code == 501
    assert response.json()["code"] == "not_implemented"
