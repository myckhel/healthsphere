import datetime as dt
import uuid

from app.models.clinic import Clinic
from app.models.patient import Patient

TEST_CLINIC_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_PATIENT_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def actor_headers() -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": "clinician-123",
        "X-HealthSphere-Actor-Role": "clinician",
        "X-HealthSphere-Clinic-Id": str(TEST_CLINIC_ID),
    }


async def test_create_triage_case_keeps_pending_items_unreviewed(client, db_session) -> None:
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    db_session.scalar.return_value = patient

    response = await client.post(
        "/api/v1/triage/cases",
        headers=actor_headers(),
        json={
            "patient_id": str(TEST_PATIENT_ID),
            "presenting_complaint": "Headache and dizziness",
            "urgency_level": "routine",
            "review_status": "pending",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["review_status"] == "pending"

    triage_case = db_session._added[0]
    assert triage_case.reviewed_by is None
    assert triage_case.reviewed_at is None


async def test_create_triage_case_stamps_reviewer_for_non_pending_states(client, db_session) -> None:
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    db_session.scalar.return_value = patient

    response = await client.post(
        "/api/v1/triage/cases",
        headers=actor_headers(),
        json={
            "patient_id": str(TEST_PATIENT_ID),
            "presenting_complaint": "Severe chest pain",
            "urgency_level": "urgent",
            "review_status": "approved",
            "recommended_queue": "physician-now",
        },
    )

    assert response.status_code == 201

    triage_case = db_session._added[0]
    assert triage_case.reviewed_by == "clinician-123"
    assert isinstance(triage_case.reviewed_at, dt.datetime)

    audit_event = db_session._added[1]
    assert audit_event.details["review_status"] == "approved"
    assert audit_event.details["reviewed_by"] == "clinician-123"


async def test_create_triage_case_enforces_deterministic_high_risk_escalation(client, db_session) -> None:
    clinic = Clinic(
        id=TEST_CLINIC_ID,
        name="HealthSphere Demo Clinic",
        country_code="NG",
        timezone="Africa/Lagos",
        is_active=True,
    )
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    db_session.scalar.side_effect = [clinic, patient]

    response = await client.post(
        "/api/v1/triage/cases",
        headers=actor_headers(),
        json={
            "patient_id": str(TEST_PATIENT_ID),
            "presenting_complaint": "Severe chest pain and shortness of breath",
            "symptoms": ["chest pain", "shortness of breath"],
            "urgency_level": "routine",
            "review_status": "pending",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["recommended_queue"] == "physician-now"

    triage_case = db_session._added[0]
    assert triage_case.recommended_action == "Immediate clinician escalation required before discharge or routine queue placement."
    assert triage_case.model_output["deterministic_guardrails"]["escalate_immediately"] is True

    audit_event = db_session._added[1]
    assert audit_event.details["escalate_immediately"] is True
    assert "possible cardiac complaint" in audit_event.details["red_flag_reasons"]
