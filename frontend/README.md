# HealthSphere Frontend

This frontend is the clinic workflow surface for HealthSphere AI. It is a Vite + React 19 + TypeScript application that now uses the existing backend API for patients, triage, consultations, and records.

## What the MVP covers

- patient onboarding backed by `POST /patients`
- symptom intake backed by `POST /triage/cases`
- live queue visibility backed by `GET /triage/queue`
- consultation creation, resume, editing, and completion backed by `GET/POST/PATCH /consultations`
- manual record capture and review backed by `GET/POST/PATCH /records`

Out of scope for this MVP:

- appointments
- binary uploads and OCR capture in the frontend workflow
- live voice capture
- automated outreach actions

## Local development

Install dependencies and run the app:

```bash
bun install
bun run dev
```

The frontend expects the backend at `http://localhost:8000/api/v1` by default.

## Environment variables

You can override the local API and stub headers with Vite env vars:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ACTOR_ID=frontend-staff-01
VITE_ACTOR_ROLE=staff
VITE_CLINIC_ID=11111111-1111-1111-1111-111111111111
```

These map to the backend's current local-development stub headers:

- `X-HealthSphere-Actor-Id`
- `X-HealthSphere-Actor-Role`
- `X-HealthSphere-Clinic-Id`

## Quality checks

Run the expected verification commands from this folder:

```bash
bun run typecheck
bun run lint
bun run build
```
