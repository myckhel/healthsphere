# HealthSphere AI

HealthSphere AI is an AI-assisted virtual health centre platform for community clinics, with an initial focus on Nigeria and similar low-resource settings.

The project is designed around a simple principle: use software and narrowly scoped AI to improve clinic workflows without replacing clinical judgment. The current codebase already includes a working backend API, a React-based frontend, local development auth stubs, and core patient, triage, consultation, and record workflows.

## Product direction

HealthSphere is intended to help clinics move from paper-heavy, reactive operations to structured, auditable, digitally assisted care.

Core goals:

- digitize paper records into structured patient data
- reduce intake and routing bottlenecks
- support clinicians during consultations without presenting AI as a diagnosis engine
- automate safe follow-up workflows over channels patients already use
- work reliably in low-bandwidth, intermittently connected environments
- keep privacy, clinician review, and auditability first-class

## Current implementation

What is working now:

- FastAPI backend with versioned routes under `/api/v1`
- PostgreSQL-backed data model and Alembic migrations
- React 19 + TypeScript + Vite frontend for clinic workflows
- local stub auth for development
- patient registration and lookup flows
- triage intake and queue views
- consultation creation, editing, resume, and completion flows
- record capture and review flows
- deterministic triage guardrails for higher-risk cases

What is planned but not fully wired yet:

- Clerk-based production authentication
- Calendly-backed appointment scheduling
- OCR-assisted record digitization with human review
- narrow healthcare agents built with the OpenAI Agents SDK
- automated follow-up and outreach messaging
- richer analytics and operational dashboards

## Architecture

The repository is organized around healthcare workflows, not vendor SDKs.

```text
health-centre/
├── backend/        # FastAPI API, domain logic, services, agents, jobs
├── frontend/       # React web application for patient and staff workflows
├── concept.md      # Product and system concept notes
├── project-requirements.md
├── docker-compose.yml
└── docker-compose.prod.yml
```

Backend layout:

- `app/api/`: HTTP routes and request handling
- `app/domain/`: deterministic business and safety rules
- `app/services/`: orchestration and integration boundaries
- `app/models/`: persistence models
- `app/schemas/`: typed API contracts
- `app/agents/`: narrow AI task boundaries
- `app/jobs/`: asynchronous workflow hooks
- `app/core/`: configuration, security, and shared infrastructure

Frontend layout:

- `src/app/`: route-level application structure
- `src/shared/`: shared UI and client-side utilities
- `src/assets/`: static assets

## Safety and product rules

This project should behave like clinic software with carefully applied AI, not an AI demo.

Non-negotiables:

- AI output must not be presented as a final diagnosis
- medication should not be prescribed autonomously
- risky or ambiguous cases should escalate to a human clinician
- OCR and extraction flows require review before trusted persistence
- privacy, minimal data handling, and audit trails matter as much as features

## Quick start

### Prerequisites

- Python 3.11+
- `uv`
- Bun
- Docker Desktop, if you want the containerized stack
- PostgreSQL, if you are running the backend locally without Docker

### Option 1: run the full development stack with Docker

From the project root:

```bash
docker compose up --build
```

This starts:

- frontend on `http://localhost:5173`
- backend on `http://localhost:8000`
- postgres on `localhost:5433`

If you want a different forwarded database port:

```bash
DB_PORT_FORWARD=55432 docker compose up --build
```

### Option 2: run backend and frontend locally

Start a PostgreSQL database first. You can use your own local Postgres instance or run only the database container:

```bash
docker compose up -d db
```

Then start the backend:

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.scripts.seed_dev_data
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
bun install
cp .env.example .env
bun run dev
```

The frontend expects the backend at `http://localhost:8000/api/v1` by default.

## Local development auth

Production authentication is not fully wired yet. For local development, protected backend routes accept stub headers:

- `X-HealthSphere-Actor-Id`
- `X-HealthSphere-Actor-Role`
- `X-HealthSphere-Clinic-Id`

The seeded local development clinic is:

- clinic ID: `11111111-1111-1111-1111-111111111111`
- clinic name: `HealthSphere Demo Clinic`

The frontend `.env.example` is already configured to use this clinic by default.

## Implemented backend route surfaces

Current backend route modules include:

- `health`
- `patients`
- `appointments`
- `triage`
- `consultations`
- `records`

Some route surfaces are scaffolded earlier than their full product workflow. The most complete flows today are patients, triage, consultations, and records.

## Quality checks

Backend:

```bash
cd backend
uv run pytest
uv run ruff check .
```

Frontend:

```bash
cd frontend
bun run typecheck
bun run lint
bun run build
```

## Production-style compose

If you want the production-style local stack:

```bash
cp .env.docker.example .env
docker compose -f docker-compose.prod.yml up --build
```

This stack defaults to `AUTH_MODE=clerk`, so it does not silently rely on stub auth headers outside the local development path.

## Documentation

Additional project context lives in:

- `backend/README.md`
- `frontend/README.md`
- `concept.md`
- `project-requirements.md`
- `Building AI Virtual Health Centers.md`

## Near-term roadmap

The next major milestones for the repository are:

1. harden auth and organization isolation
2. flesh out appointment scheduling and reminder workflows
3. add OCR ingestion with explicit review steps
4. introduce narrow, auditable agents for intake, triage support, and follow-up drafting
5. expand clinician-facing dashboards and operational analytics

## Decision standard

If a change improves polish but weakens safety, maintainability, privacy, or reliability under weak connectivity, it is the wrong change for this project.