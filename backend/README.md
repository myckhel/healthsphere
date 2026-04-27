# HealthSphere Backend

FastAPI scaffold for HealthSphere's clinic workflows.

## What is included

- versioned FastAPI app shell
- async SQLAlchemy foundation for PostgreSQL
- Alembic migration scaffold
- Clerk-shaped auth boundary using local development headers
- initial route surfaces for health, patients, appointments, records, and triage

## Local development

```bash
cd /Users/user/Desktop/apps/learn/andela-ai/health-centre/backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Migrations

```bash
uv run alembic upgrade head
```

## Development seed

The frontend and local stub-auth examples use clinic ID `11111111-1111-1111-1111-111111111111`.
Seed that clinic once after migrations so clinic-scoped writes have a valid parent row:

```bash
uv run python -m app.scripts.seed_dev_data
```

## Quality checks

```bash
uv run pytest
uv run ruff check .
```

## Docker

Development stack from the project root:

```bash
docker compose up --build
```

Production-style stack from the project root:

```bash
cp .env.docker.example .env
docker compose -f docker-compose.prod.yml up --build
```

The development stack exposes:

- frontend on `http://localhost:5173`
- backend on `http://localhost:8000`
- postgres on `localhost:5433` by default

If you want a different host port for the containerized database, set `DB_PORT_FORWARD` before starting Compose.

```bash
DB_PORT_FORWARD=55432 docker compose up --build
```

The production-style stack exposes:

- frontend on `http://localhost:8080`
- backend on `http://localhost:8000`

The production stack defaults to `AUTH_MODE=clerk` so it will not silently use stub headers outside local development.

## Stub auth for protected routes

Until Clerk verification is wired, protected routes accept these headers in local development:

- `X-HealthSphere-Actor-Id`
- `X-HealthSphere-Actor-Role`
- `X-HealthSphere-Clinic-Id`

The clinic header is now required for non-admin protected routes so read and write queries stay clinic-scoped in local development.

## Guardrails

- expensive endpoints such as record retrieval, record upload, and consultation workspace routes are rate limited in-process
- retrieval ranking is bounded by configured candidate and result limits
- agent payloads are truncated to a shared character budget before model execution
- request logging is PHI-safe and records only hashed actor identity plus operational metadata
- high-risk triage complaints are escalated deterministically and cannot be discharged through the consultation workflow without escalation

## API contract doc

For a frontend-facing contract summary of the current backend routes, request and response shapes, and implemented versus scaffolded endpoints, see:

- [docs/frontend-api-contract.md](./docs/frontend-api-contract.md)
