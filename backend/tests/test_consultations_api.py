import datetime as dt
import uuid

from app.models.consultation_session import ConsultationSession
from app.models.clinic import Clinic
from app.models.patient import Patient
from app.models.record import Record
from app.models.record_chunk import RecordChunk
from app.models.triage_case import TriageCase
from app.services.embedding_service import EmbeddingService

TEST_CLINIC_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_PATIENT_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
TEST_TRIAGE_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def actor_headers() -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": "clinician-123",
        "X-HealthSphere-Actor-Role": "clinician",
        "X-HealthSphere-Clinic-Id": str(TEST_CLINIC_ID),
    }


async def test_create_consultation_returns_workspace_snapshot_and_draft_package(
    client,
    db_session,
) -> None:
    now = dt.datetime.now(dt.timezone.utc)
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
        external_id="HS-0001",
        first_name="Ada",
        last_name="Okafor",
        phone_number="+2348012345678",
        consent_status="granted",
    )
    triage_case = TriageCase(
        id=TEST_TRIAGE_ID,
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        source="intake",
        status="open",
        urgency_level="routine",
        presenting_complaint="Headache and dizziness for three days",
        symptoms=["headache", "dizziness"],
        recommended_queue="general-physician",
        review_status="pending",
        created_at=now,
        updated_at=now,
    )
    record = Record(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        title="Recent vitals note",
        record_type="visit_note",
        source="manual",
        review_status="approved",
        created_at=now,
        updated_at=now,
    )
    chunk = RecordChunk(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        record_id=record.id,
        chunk_index=0,
        content="Patient previously reported dizziness and elevated blood pressure.",
        embedding=EmbeddingService().embed_text("dizziness elevated blood pressure"),
        created_at=now,
        updated_at=now,
    )
    chunk.record = record

    db_session.scalar.side_effect = [clinic, patient, triage_case]
    db_session.scalars.return_value = type(
        "ScalarResult",
        (),
        {"all": lambda self: [chunk]},
    )()

    response = await client.post(
        "/api/v1/consultations",
        headers=actor_headers(),
        json={
            "patient_id": str(TEST_PATIENT_ID),
            "triage_case_id": str(TEST_TRIAGE_ID),
            "clinician_name": "Dr. Sadiq Musa",
            "status": "ready",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["patient_snapshot"]["full_name"] == "Ada Okafor"
    assert body["patient_snapshot"]["presenting_complaint"] == "Headache and dizziness for three days"
    assert len(body["retrieved_context"]) == 1
    assert body["draft_assessment_package"]["review_status"] == "needs_review"
    assert body["draft_assessment_package"]["complaint_summary"] == "Headache and dizziness for three days"

    consultation = db_session._added[0]
    assert consultation.draft_note["draft_assessment_package"]["source"] in {"agent", "fallback"}

    audit_event = db_session._added[-1]
    assert audit_event.details["retrieved_context_count"] == 1


async def test_complete_consultation_requires_explicit_clinician_review(client, db_session) -> None:
    now = dt.datetime.now(dt.timezone.utc)
    consultation = ConsultationSession(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        triage_case_id=TEST_TRIAGE_ID,
        status="in_progress",
        clinician_id="clinician-123",
        draft_note={
            "assessment": "Likely uncomplicated headache pending exam.",
            "carePlan": "Hydration, exam, and blood pressure check.",
        },
        started_at=now,
    )

    db_session.scalar.return_value = consultation

    response = await client.patch(
        f"/api/v1/consultations/{consultation.id}",
        headers=actor_headers(),
        json={
            "status": "completed",
            "next_action": "discharge",
        },
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Explicit clinician review is required before completing a consultation."


async def test_complete_consultation_stamps_review_and_closes_triage_case(client, db_session) -> None:
    now = dt.datetime.now(dt.timezone.utc)
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    triage_case = TriageCase(
        id=TEST_TRIAGE_ID,
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        source="intake",
        status="in_consultation",
        urgency_level="routine",
        presenting_complaint="Headache and dizziness for three days",
        symptoms=["headache"],
        review_status="pending",
        created_at=now,
        updated_at=now,
    )
    consultation = ConsultationSession(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        triage_case_id=TEST_TRIAGE_ID,
        status="in_progress",
        clinician_id="clinician-123",
        clinician_name="Dr. Sadiq Musa",
        next_action=None,
        draft_note={
            "assessment": "Likely uncomplicated headache pending final clinician confirmation.",
            "carePlan": "Provide guidance and return precautions.",
            "draft_assessment_package": {
                "source": "fallback",
                "generated_at": now.isoformat(),
                "review_status": "needs_review",
                "complaint_summary": "Headache and dizziness for three days",
                "subjective": "Headache and dizziness for three days",
                "assessment": "Draft assessment",
                "plan": "Draft plan",
                "follow_up_questions": [],
                "next_action_suggestion": "follow-up-booking",
            },
        },
        started_at=now,
    )
    consultation.patient = patient
    consultation.triage_case = triage_case

    db_session.scalar.return_value = consultation
    db_session.scalars.return_value = type(
        "ScalarResult",
        (),
        {"all": lambda self: []},
    )()

    response = await client.patch(
        f"/api/v1/consultations/{consultation.id}",
        headers=actor_headers(),
        json={
            "status": "completed",
            "next_action": "discharge",
            "final_assessment_reviewed": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["clinician_review"]["is_finalized"] is True
    assert body["clinician_review"]["reviewed_by"] == "clinician-123"
    assert triage_case.status == "closed"
    assert consultation.completed_at is not None
    assert consultation.draft_note["clinician_review"]["is_finalized"] is True

    audit_event = db_session._added[0]
    assert audit_event.details["after_status"] == "completed"
    assert audit_event.details["final_assessment_reviewed"] is True