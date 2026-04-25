import uuid

TEST_CLINIC_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def actor_headers() -> dict[str, str]:
    return {
        "X-HealthSphere-Actor-Id": "staff-123",
        "X-HealthSphere-Actor-Role": "staff",
        "X-HealthSphere-Clinic-Id": str(TEST_CLINIC_ID),
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