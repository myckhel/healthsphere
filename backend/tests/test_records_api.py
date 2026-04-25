import datetime as dt
import uuid

from app.models.patient import Patient
from app.models.record import Record

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
