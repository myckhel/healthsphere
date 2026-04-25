async def test_health_returns_service_status(client) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "HealthSphere API"


async def test_openapi_exposes_initial_workflow_routes(client) -> None:
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/patients" in paths
    assert "/api/v1/appointments" in paths
    assert "/api/v1/consultations" in paths
    assert "/api/v1/records" in paths
    assert "/api/v1/triage/cases" in paths
    assert "/api/v1/triage/queue" in paths
