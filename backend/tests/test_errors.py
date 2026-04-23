async def test_unknown_route_uses_json_error_envelope(client) -> None:
    response = await client.get("/api/v1/missing")

    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "not_found"
    assert body["request_id"]


async def test_validation_errors_use_shared_shape(client) -> None:
    response = await client.post(
        "/api/v1/patients",
        headers={"X-HealthSphere-Actor-Id": "staff-123"},
        json={},
    )

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_error"
    assert body["details"]
