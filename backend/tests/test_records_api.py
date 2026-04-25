import datetime as dt
import uuid

from app.models.patient import Patient
from app.models.record import Record
from app.models.record_chunk import RecordChunk
from app.services.embedding_service import EmbeddingService

TEST_CLINIC_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_PATIENT_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
TEST_RECORD_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def actor_headers() -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": "clinician-123",
        "X-HealthSphere-Actor-Role": "clinician",
        "X-HealthSphere-Clinic-Id": str(TEST_CLINIC_ID),
    }


async def test_create_record_persists_record_and_audit_event(client, db_session) -> None:
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    db_session.scalar.return_value = patient

    response = await client.post(
        "/api/v1/records",
        headers=actor_headers(),
        json={
            "patient_id": str(TEST_PATIENT_ID),
            "title": "Initial vitals scan",
            "record_type": "vitals",
            "source": "manual",
            "raw_text": "BP 120/80, pulse 72.",
            "structured_data": {"blood_pressure": "120/80", "pulse": 72},
            "review_status": "pending",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["patient_id"] == str(TEST_PATIENT_ID)
    assert body["record_type"] == "vitals"
    assert body["review_status"] == "pending"
    assert body["reviewed_by"] is None

    added_types = [type(item).__name__ for item in db_session._added]
    assert added_types == ["Record", "AuditEvent"]


async def test_get_and_list_records_return_scoped_record_data(client, db_session) -> None:
    timestamp = dt.datetime(2026, 4, 25, 9, 0, tzinfo=dt.timezone.utc)
    record = Record(
        id=TEST_RECORD_ID,
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        title="CBC result",
        record_type="lab",
        source="manual",
        raw_text="Normal CBC panel.",
        structured_data={"hemoglobin": 13.2},
        provenance={"uploaded_by": "staff-22"},
        review_status="approved",
        reviewed_by="clinician-123",
        reviewed_at=timestamp,
        created_at=timestamp,
        updated_at=timestamp,
    )
    db_session.scalars.return_value = type("ScalarResult", (), {"all": lambda self: [record]})()
    db_session.scalar.return_value = record

    list_response = await client.get(
        f"/api/v1/records?patient_id={TEST_PATIENT_ID}&review_status=approved",
        headers=actor_headers(),
    )
    detail_response = await client.get(
        f"/api/v1/records/{TEST_RECORD_ID}",
        headers=actor_headers(),
    )

    assert list_response.status_code == 200
    assert list_response.json()[0]["id"] == str(TEST_RECORD_ID)
    assert detail_response.status_code == 200
    assert detail_response.json()["structured_data"] == {"hemoglobin": 13.2}


async def test_review_record_sets_reviewer_fields_and_audits_change(client, db_session) -> None:
    timestamp = dt.datetime(2026, 4, 25, 9, 0, tzinfo=dt.timezone.utc)
    record = Record(
        id=TEST_RECORD_ID,
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        title="Referral letter",
        record_type="referral",
        source="manual",
        review_status="pending",
        created_at=timestamp,
        updated_at=timestamp,
    )
    db_session.scalar.return_value = record

    response = await client.patch(
        f"/api/v1/records/{TEST_RECORD_ID}/review",
        headers=actor_headers(),
        json={"review_status": "approved"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["review_status"] == "approved"
    assert body["reviewed_by"] == "clinician-123"
    assert body["reviewed_at"] is not None

    added_types = [type(item).__name__ for item in db_session._added]
    assert added_types == ["AuditEvent"]


async def test_upload_record_persists_ingestion_artifacts(client, db_session) -> None:
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    db_session.scalar.return_value = patient

    response = await client.post(
        "/api/v1/records/upload",
        headers=actor_headers(),
        data={
            "patient_id": str(TEST_PATIENT_ID),
            "title": "Referral scan upload",
            "record_type": "referral",
        },
        files={
            "file": (
                "referral.txt",
                b"Referral note\nNeeds blood pressure follow-up",
                "text/plain",
            )
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["source"] == "upload"
    assert body["review_status"] == "needs_review"
    assert body["ocr_status"] == "completed"
    assert body["chunk_count"] >= 1
    assert body["retrieval_ready"] is True

    added_types = [type(item).__name__ for item in db_session._added]
    assert added_types[0] == "Record"
    assert "RecordChunk" in added_types
    assert added_types[-1] == "AuditEvent"


async def test_retrieve_records_ranks_patient_chunks_by_similarity_and_recency(client, db_session) -> None:
    embedding_service = EmbeddingService()
    now = dt.datetime.now(dt.timezone.utc)
    newer_record = Record(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        title="Recent hypertension note",
        record_type="clinical_note",
        source="upload",
        review_status="needs_review",
        created_at=now,
        updated_at=now,
    )
    older_record = Record(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        title="Older dermatology note",
        record_type="clinical_note",
        source="upload",
        review_status="needs_review",
        created_at=now - dt.timedelta(days=90),
        updated_at=now - dt.timedelta(days=90),
    )
    patient = Patient(
        id=TEST_PATIENT_ID,
        clinic_id=TEST_CLINIC_ID,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    newer_chunk = RecordChunk(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        record_id=newer_record.id,
        chunk_index=0,
        content="Blood pressure remains elevated and needs follow-up monitoring.",
        embedding=embedding_service.embed_text("blood pressure follow-up monitoring"),
        created_at=newer_record.created_at,
        updated_at=newer_record.updated_at,
    )
    newer_chunk.record = newer_record
    older_chunk = RecordChunk(
        id=uuid.uuid4(),
        clinic_id=TEST_CLINIC_ID,
        patient_id=TEST_PATIENT_ID,
        record_id=older_record.id,
        chunk_index=0,
        content="Rash improved after topical treatment.",
        embedding=embedding_service.embed_text("rash improved after topical treatment"),
        created_at=older_record.created_at,
        updated_at=older_record.updated_at,
    )
    older_chunk.record = older_record

    db_session.scalar.return_value = patient
    db_session.scalars.return_value = type(
        "ScalarResult",
        (),
        {"all": lambda self: [older_chunk, newer_chunk]},
    )()

    response = await client.get(
        f"/api/v1/records/retrieve?patient_id={TEST_PATIENT_ID}&q=blood%20pressure%20follow-up",
        headers=actor_headers(),
    )

    assert response.status_code == 200
    body = response.json()
    assert body[0]["record_id"] == str(newer_record.id)
    assert body[0]["combined_score"] >= body[1]["combined_score"]
