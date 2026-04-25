# HealthSphere Backend API Contract for Frontend and LLM Consumption

This document describes the current backend API surface as implemented in `backend/app/api/v1`.

It is meant to help:

- frontend engineers wire UI flows without reading backend code first
- LLMs reason over the API surface with fewer wrong assumptions
- future contributors see which routes are implemented versus scaffolded

Base URL in local development:

```text
http://localhost:8000/api/v1
```

OpenAPI is also available at:

```text
http://localhost:8000/openapi.json
```

## Current status

Implemented now:

- `GET /health`
- `GET /ready`
- `GET /patients`
- `POST /patients`
- `GET /triage/cases`
- `POST /triage/cases`
- `GET /triage/queue`
- `GET /consultations`
- `GET /consultations/{consultation_id}`
- `POST /consultations`
- `PATCH /consultations/{consultation_id}`
- `GET /records`
- `GET /records/{record_id}`
- `POST /records`
- `PATCH /records/{record_id}/review`

Scaffolded but not implemented:

- `GET /appointments`
- `POST /appointments`
- `POST /records/upload`

For scaffolded routes, expect `501 Not Implemented` with the standard error envelope.

## Authentication and clinic scope

Until Clerk verification is wired, protected routes use stub headers in local development:

- `X-HealthSphere-Actor-Id`
- `X-HealthSphere-Actor-Role`
- `X-HealthSphere-Clinic-Id`

Allowed actor roles:

- `patient`
- `staff`
- `clinician`
- `admin`

Example headers:

```http
X-HealthSphere-Actor-Id: clinician-123
X-HealthSphere-Actor-Role: clinician
X-HealthSphere-Clinic-Id: 11111111-1111-1111-1111-111111111111
```

Clinic scoping rules:

- list and read routes automatically filter by `X-HealthSphere-Clinic-Id` when present
- write routes accept `clinic_id` in the request body, but it must match the actor clinic if the header is set
- if the header clinic is invalid UUID, the API returns `400`
- if a request tries to write outside the actor clinic, the API returns `403`

## Shared response conventions

## Success responses

- `GET` list routes return arrays
- `GET` detail routes return one object
- `POST` create routes return the created object
- `PATCH` update routes return the updated object

## Error envelope

All handled errors use this JSON shape:

```json
{
  "code": "not_found",
  "message": "Record not found for the current clinic scope.",
  "request_id": "6e9d23f5-8f14-4c0f-9d2d-6f1d1b1a8f75"
}
```

Possible `code` values currently used:

- `bad_request`
- `unauthorized`
- `forbidden`
- `not_found`
- `conflict`
- `validation_error`
- `not_implemented`

Validation failures may also include:

```json
{
  "code": "validation_error",
  "message": "Request validation failed",
  "request_id": "…",
  "details": []
}
```

## API reference

## Health

### `GET /health`

Purpose:
- liveness check

Response:

```json
{
  "status": "ok",
  "service": "HealthSphere API",
  "version": "0.1.0"
}
```

### `GET /ready`

Purpose:
- readiness check with database probe

Response:

```json
{
  "status": "ready",
  "service": "HealthSphere API",
  "version": "0.1.0"
}
```

## Patients

### `GET /patients`

Purpose:
- list patients in clinic scope
- lightweight search by first name, last name, or external ID

Query parameters:

- `q` optional string

Response item shape:

```json
{
  "id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "external_id": "MRN-10023",
  "first_name": "Ada",
  "last_name": "Okafor",
  "date_of_birth": "1994-02-11",
  "sex_at_birth": "female",
  "phone_number": "+2348000000000",
  "consent_status": "granted"
}
```

Frontend notes:

- use this for search/autocomplete and simple roster views
- `notes` is not returned here

### `POST /patients`

Purpose:
- create a patient record

Request body:

```json
{
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "external_id": "MRN-10023",
  "first_name": "Ada",
  "last_name": "Okafor",
  "date_of_birth": "1994-02-11",
  "sex_at_birth": "female",
  "phone_number": "+2348000000000",
  "consent_status": "granted",
  "notes": "Patient prefers SMS reminders."
}
```

Response:
- same shape as `GET /patients` item

Behavior notes:

- `external_id` is optional
- if `external_id` already exists in the same clinic scope, returns `409 conflict`

## Triage

### `GET /triage/cases`

Purpose:
- list all triage cases in clinic scope

Response item shape:

```json
{
  "id": "c87f0c28-73c2-4f8f-a4f9-9d50ce157b57",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "source": "intake",
  "status": "open",
  "urgency_level": "routine",
  "presenting_complaint": "Headache and dizziness for two days.",
  "recommended_queue": "general",
  "review_status": "pending"
}
```

### `POST /triage/cases`

Purpose:
- create a triage case from patient intake or staff capture

Request body:

```json
{
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "source": "intake",
  "urgency_level": "routine",
  "presenting_complaint": "Headache and dizziness for two days.",
  "symptoms": ["headache", "dizziness"],
  "recommended_queue": "general",
  "recommended_action": "Vitals check before physician review.",
  "model_output": {
    "draft_summary": "Non-emergency neuro complaint"
  },
  "review_status": "pending"
}
```

Response:
- same shape as `GET /triage/cases` item

Behavior notes:

- `patient_id` is optional
- when `patient_id` is sent, the patient must exist in clinic scope or the API returns `404`
- `model_output` is draft data only and should not be treated as clinician-approved

### `GET /triage/queue`

Purpose:
- return queue cards shaped for physician or staff queue views

Response item shape:

```json
{
  "triage_case_id": "c87f0c28-73c2-4f8f-a4f9-9d50ce157b57",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "patient_name": "Ada Okafor",
  "urgency_level": "routine",
  "visit_reason": "Headache and dizziness for two days.",
  "recommended_queue": "general",
  "status": "open",
  "wait_minutes": 18,
  "queued_at": "2026-04-25T10:12:33.120000+00:00"
}
```

Behavior notes:

- only triage cases with `status == "open"` are returned
- `patient_name` becomes `"Unlinked patient"` when no patient is attached
- `wait_minutes` is computed server-side

## Consultations

### Enum values used by consultation routes

`status`:

- `ready`
- `in_progress`
- `completed`

`next_action`:

- `follow-up-booking`
- `nurse-handoff`
- `referral`
- `discharge`

### `GET /consultations`

Purpose:
- list consultation sessions

Query parameters:

- `patient_id` optional UUID
- `status` optional string

Response item shape:

```json
{
  "id": "eb0d8903-f9e2-4963-9961-c9fa7d3d9684",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "triage_case_id": "c87f0c28-73c2-4f8f-a4f9-9d50ce157b57",
  "status": "in_progress",
  "clinician_id": "clinician-123",
  "clinician_name": "Dr. Ibrahim",
  "next_action": null,
  "started_at": "2026-04-25T10:20:00+00:00",
  "completed_at": null
}
```

### `GET /consultations/{consultation_id}`

Purpose:
- fetch one consultation with draft note payload

Response shape:

```json
{
  "id": "eb0d8903-f9e2-4963-9961-c9fa7d3d9684",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "triage_case_id": "c87f0c28-73c2-4f8f-a4f9-9d50ce157b57",
  "status": "in_progress",
  "clinician_id": "clinician-123",
  "clinician_name": "Dr. Ibrahim",
  "next_action": "follow-up-booking",
  "started_at": "2026-04-25T10:20:00+00:00",
  "completed_at": null,
  "draft_note": {
    "subjective": "Patient reports dizziness when standing.",
    "assessment": "Likely dehydration, needs exam."
  }
}
```

### `POST /consultations`

Purpose:
- create a consultation session tied to a patient and optionally a triage case

Request body:

```json
{
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "triage_case_id": "c87f0c28-73c2-4f8f-a4f9-9d50ce157b57",
  "clinician_name": "Dr. Ibrahim",
  "status": "in_progress",
  "draft_note": {
    "subjective": "Patient reports dizziness when standing."
  }
}
```

Response:
- same shape as consultation detail

Behavior notes:

- `clinician_id` is taken from `X-HealthSphere-Actor-Id`, not the body
- `started_at` is auto-set when status is `in_progress`
- `completed_at` is auto-set when status is `completed`
- referenced patient and triage case must exist in clinic scope

### `PATCH /consultations/{consultation_id}`

Purpose:
- update consultation progress, note content, and next action

Request body:

```json
{
  "clinician_name": "Dr. Ibrahim",
  "status": "completed",
  "next_action": "follow-up-booking",
  "draft_note": {
    "subjective": "Patient improved after fluids.",
    "plan": "Follow up in 48 hours."
  }
}
```

Response:
- same shape as consultation detail

Behavior notes:

- all fields are optional
- changing status to `in_progress` stamps `started_at` if it was empty
- changing status to `completed` stamps `completed_at` and ensures `started_at` exists

## Records

### `GET /records`

Purpose:
- list patient records in clinic scope

Query parameters:

- `patient_id` optional UUID
- `review_status` optional string

Response item shape:

```json
{
  "id": "0d5989ea-e9cb-44b1-85b7-58ea95a8fa65",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "title": "CBC result",
  "record_type": "lab",
  "source": "manual",
  "review_status": "approved",
  "reviewed_by": "clinician-123"
}
```

Frontend notes:

- use this for record lists, tabs, and filtered views
- raw text and structured data are only available from the detail route

### `GET /records/{record_id}`

Purpose:
- fetch full record content

Response shape:

```json
{
  "id": "0d5989ea-e9cb-44b1-85b7-58ea95a8fa65",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "title": "CBC result",
  "record_type": "lab",
  "source": "manual",
  "review_status": "approved",
  "reviewed_by": "clinician-123",
  "raw_text": "Normal CBC panel.",
  "structured_data": {
    "hemoglobin": 13.2
  },
  "provenance": {
    "uploaded_by": "staff-22"
  },
  "reviewed_at": "2026-04-25T09:00:00+00:00",
  "created_at": "2026-04-25T09:00:00+00:00",
  "updated_at": "2026-04-25T09:00:00+00:00"
}
```

### `POST /records`

Purpose:
- create a structured or manual patient record entry

Request body:

```json
{
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "title": "Initial vitals scan",
  "record_type": "vitals",
  "source": "manual",
  "raw_text": "BP 120/80, pulse 72.",
  "structured_data": {
    "blood_pressure": "120/80",
    "pulse": 72
  },
  "provenance": {
    "captured_by": "front-desk-staff"
  },
  "review_status": "pending"
}
```

Response:
- same shape as record detail

Behavior notes:

- patient must exist in clinic scope
- if `review_status` is still pending or needs review, `reviewed_by` and `reviewed_at` stay `null`
- if `review_status` is already non-pending, the backend stamps reviewer metadata from the acting user

### `PATCH /records/{record_id}/review`

Purpose:
- update clinical review state for a record

Request body:

```json
{
  "review_status": "approved"
}
```

Response:
- same shape as record detail

Behavior notes:

- reviewer identity comes from `X-HealthSphere-Actor-Id`
- if the new review status still implies pending review, reviewer fields are cleared
- if the new review status is non-pending, reviewer fields are stamped

## Appointments

### `GET /appointments`

Current behavior:

```json
[]
```

This route is scaffolded only and does not yet read from persistence.

### `POST /appointments`

Current behavior:

- returns `501 not_implemented`

Planned request shape once implemented:

```json
{
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "d8ce4dc9-2517-40d9-a5c7-e5d0d2f48731",
  "scheduled_start_at": "2026-04-26T09:00:00+00:00",
  "scheduled_end_at": "2026-04-26T09:20:00+00:00",
  "visit_reason": "Follow-up blood pressure check",
  "source": "manual",
  "external_reference": "cal-evt-01"
}
```

## Record upload

### `POST /records/upload`

Current behavior:

- returns `501 not_implemented`

This route is reserved for Iteration 4 record ingestion and OCR workflow.

## Field and enum reference

These values are not globally enforced beyond current route validation, but they are the active backend contract now.

### Common role values

- `patient`
- `staff`
- `clinician`
- `admin`

### Consultation status values

- `ready`
- `in_progress`
- `completed`

### Consultation next action values

- `follow-up-booking`
- `nurse-handoff`
- `referral`
- `discharge`

### Review status values currently used by backend flows

Common values seen in the current codebase:

- `pending`
- `needs_review`
- `approved`

Frontend guidance:

- treat `pending` and `needs_review` as not yet clinician-approved
- avoid inventing new review status strings without aligning with backend first

## Integration guidance for frontend and LLMs

Use these rules when generating frontend code or agent behavior:

- always send stub auth headers in local development
- always send `X-HealthSphere-Clinic-Id` as a valid UUID string if you want clinic-scoped behavior
- prefer backend-generated IDs and timestamps over client-generated values
- treat `model_output`, `draft_note`, and any non-approved review states as draft material, not final clinical truth
- expect `404` when referencing patients, records, triage cases, or consultations outside scope
- expect `409` when reusing a patient `external_id` in the same clinic
- do not assume scaffolded routes are safe to call in production flows yet

## Suggested frontend route-to-API mapping

- patient onboarding -> `POST /patients`
- patient lookup/search -> `GET /patients?q=...`
- complaint intake submit -> `POST /triage/cases`
- physician queue -> `GET /triage/queue`
- consultation workspace list -> `GET /consultations`
- consultation workspace detail -> `GET /consultations/{consultation_id}`
- consultation create -> `POST /consultations`
- consultation update/finalize -> `PATCH /consultations/{consultation_id}`
- record list -> `GET /records?patient_id=...`
- record detail -> `GET /records/{record_id}`
- manual record entry -> `POST /records`
- record review action -> `PATCH /records/{record_id}/review`

## Example local flow

1. Create patient with `POST /patients`
2. Create triage case with `POST /triage/cases`
3. Load physician queue with `GET /triage/queue`
4. Create consultation with `POST /consultations`
5. Update consultation as clinician works with `PATCH /consultations/{consultation_id}`
6. Add records with `POST /records`
7. Approve records with `PATCH /records/{record_id}/review`

## Source of truth

This document reflects the backend code as of the current implementation in:

- `backend/app/api/v1/*.py`
- `backend/app/schemas/*.py`

If this file drifts from the code, treat the code and OpenAPI output as authoritative and update this document.
