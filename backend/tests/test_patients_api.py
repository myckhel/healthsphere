import uuid

from app.models.patient import Patient

TEST_CLINIC_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def actor_headers() -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": "staff-123",
        "X-HealthSphere-Actor-Role": "staff",
        "X-HealthSphere-Clinic-Id": str(TEST_CLINIC_ID),
    }


def patient_actor_headers(actor_id: str) -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": actor_id,
        "X-HealthSphere-Actor-Role": "patient",
    }


async def test_create_patient_rejects_unknown_clinic_scope(client, db_session) -> None:
    db_session.scalar.return_value = None

    response = await client.post(
        "/api/v1/patients",
        headers=actor_headers(),
        json={
            "first_name": "Ada",
            "last_name": "Okafor",
            "consent_status": "pending",
        },
    )

    assert response.status_code == 404
    assert response.json()["message"] == "Clinic not found for the current clinic scope."


async def test_lookup_patient_by_external_id_returns_exact_match(client, db_session) -> None:
    patient = Patient(
        id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        clinic_id=TEST_CLINIC_ID,
        external_id="HC-2044",
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
        phone_number="+2348000000000",
    )
    db_session.scalar.return_value = patient

    response = await client.get(
        "/api/v1/patients/lookup?external_id=HC-2044",
        headers=actor_headers(),
    )

    assert response.status_code == 200
    assert response.json()["patient"] == {
        "id": "22222222-2222-2222-2222-222222222222",
        "clinic_id": str(TEST_CLINIC_ID),
        "external_id": "HC-2044",
        "first_name": "Ada",
        "last_name": "Okafor",
        "date_of_birth": None,
        "sex_at_birth": None,
        "phone_number": "+2348000000000",
        "consent_status": "granted",
    }


async def test_lookup_patient_by_external_id_returns_null_when_missing(client, db_session) -> None:
    db_session.scalar.return_value = None

    response = await client.get(
        "/api/v1/patients/lookup?external_id=UNKNOWN-1",
        headers=actor_headers(),
    )

    assert response.status_code == 200
    assert response.json() == {"patient": None}


async def test_lookup_patient_by_external_id_allows_patient_self_lookup_without_clinic_scope(
    client, db_session
) -> None:
    patient = Patient(
        id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        clinic_id=TEST_CLINIC_ID,
        external_id="12345678",
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )
    db_session.scalar.return_value = patient

    response = await client.get(
        "/api/v1/patients/lookup?external_id=12345678",
        headers=patient_actor_headers("12345678"),
    )

    assert response.status_code == 200
    assert response.json()["patient"]["external_id"] == "12345678"


async def test_lookup_patient_by_external_id_rejects_patient_lookup_for_other_external_id(
    client, db_session
) -> None:
    response = await client.get(
        "/api/v1/patients/lookup?external_id=12345678",
        headers=patient_actor_headers("someone-else"),
    )

    assert response.status_code == 403
    assert response.json()["message"] == (
        "Patient actors may only look up their own external ID."
    )