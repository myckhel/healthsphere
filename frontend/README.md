# HealthSphere Web App

This web app is the clinic workflow surface for HealthSphere AI. It is a Vite + React 19 + TypeScript application that uses the existing backend API for patients, triage, consultations, and records.

## What the app covers now

- patient onboarding backed by `POST /patients`
- symptom intake backed by `POST /triage/cases`
- live queue visibility backed by `GET /triage/queue`
- consultation creation, resume, editing, and completion backed by `GET/POST/PATCH /consultations`
- manual record capture and review backed by `GET/POST/PATCH /records`

Out of scope right now:

- appointments
- binary uploads and OCR capture in the web app workflow
- live voice capture
- automated outreach actions

## Local development

Install dependencies and run the app:

```bash
bun install
cp .env.example .env
bun run dev
```

The web app expects the backend at `http://localhost:8000/api/v1` by default.

## Environment variables

You can override the local API and stub headers with Vite env vars:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_PROXY_TARGET=http://localhost:8000
VITE_ACTOR_ID=frontend-staff-01
VITE_ACTOR_ROLE=staff
VITE_CLINIC_ID=11111111-1111-1111-1111-111111111111
```

Copy `.env.example` to `.env` for local development. `VITE_API_PROXY_TARGET` is used by the Vite dev server proxy, while `VITE_API_BASE_URL` is used by the browser client.

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
