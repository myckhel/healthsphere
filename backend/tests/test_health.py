import datetime as dt
import uuid

from app.core.monitoring import default_monitoring_service
from app.models.ai_usage_event import AIUsageEvent


def admin_headers() -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": "admin-123",
        "X-HealthSphere-Actor-Role": "admin",
    }


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
    assert "/api/v1/monitoring/metrics" in paths
    assert "/api/v1/monitoring/guardrails" in paths
    assert "/api/v1/monitoring/ai-usage" in paths
    assert "/api/v1/records" in paths
    assert "/api/v1/triage/cases" in paths
    assert "/api/v1/triage/queue" in paths


async def test_monitoring_metrics_requires_admin_role(client) -> None:
    response = await client.get(
        "/api/v1/monitoring/metrics",
        headers={
            "X-HealthSphere-Actor-Id": "clinician-123",
            "X-HealthSphere-Actor-Role": "clinician",
        },
    )

    assert response.status_code == 403
    assert response.json()["message"] == "Admin access is required for monitoring routes."


async def test_monitoring_guardrails_returns_recent_events(client) -> None:
    default_monitoring_service.record_guardrail_event(
        event_type="triage_escalation",
        message="Deterministic triage guardrails forced clinician escalation.",
        route="/api/v1/triage/cases",
        actor_role="clinician",
        clinic_id="11111111-1111-1111-1111-111111111111",
        metadata={"red_flag_reasons": ["possible cardiac complaint"]},
    )

    response = await client.get(
        "/api/v1/monitoring/guardrails",
        headers=admin_headers(),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["configuration"]["clinic_scope_required"] is True
    assert body["recent_events"][0]["event_type"] == "triage_escalation"


async def test_monitoring_ai_usage_returns_grouped_costs(client, db_session) -> None:
    now = dt.datetime.now(dt.timezone.utc)
    db_session.scalars.return_value = type(
        "ScalarResult",
        (),
        {
            "all": lambda self: [
                AIUsageEvent(
                    id=uuid.uuid4(),
                    clinic_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
                    actor_id="clinician-123",
                    actor_role="clinician",
                    workflow="consultation_support",
                    provider="openai",
                    model="gpt-4.1-mini",
                    request_count=1,
                    input_tokens=120,
                    output_tokens=40,
                    total_tokens=160,
                    cached_input_tokens=20,
                    reasoning_tokens=0,
                    estimated_cost_usd=0.00012,
                    created_at=now,
                    updated_at=now,
                ),
                AIUsageEvent(
                    id=uuid.uuid4(),
                    clinic_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
                    actor_id="clinician-123",
                    actor_role="clinician",
                    workflow="lab_result_translation",
                    provider="openai",
                    model="gpt-4.1-mini",
                    request_count=1,
                    input_tokens=80,
                    output_tokens=20,
                    total_tokens=100,
                    cached_input_tokens=0,
                    reasoning_tokens=0,
                    estimated_cost_usd=0.000064,
                    created_at=now,
                    updated_at=now,
                ),
            ]
        },
    )()

    response = await client.get(
        "/api/v1/monitoring/ai-usage",
        headers=admin_headers(),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["totals"]["run_count"] == 2
    assert body["totals"]["total_tokens"] == 260
    assert body["by_actor"][0]["actor_id"] == "clinician-123"
    assert {item["workflow"] for item in body["by_workflow"]} == {
        "consultation_support",
        "lab_result_translation",
    }
