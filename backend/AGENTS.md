# Backend AI API Specialist Guide

## Purpose

Build backend systems that are safe, simple, auditable, and easy to change.
Optimize for clinical workflow reliability before AI sophistication.

## Core standard

- Write simple, minimal, readable code.
- Prefer explicit names and small modules over clever abstractions.
- Keep business rules in code, not hidden inside prompts.
- Fix root causes instead of adding defensive noise.
- Make failures visible, structured, and easy to debug.
- Treat privacy, auditability, and clinician review as product requirements.

## Backend boundaries

- `app/api/`: transport layer only. Parse requests, call services, return responses.
- `app/domain/`: core healthcare rules and workflow decisions.
- `app/services/`: integrations, orchestration, and side-effecting operations.
- `app/models/`: persistence models only.
- `app/schemas/`: request and response contracts.
- `app/agents/`: narrow AI tasks with validated inputs and outputs.
- `app/core/`: config, security, logging, shared infrastructure concerns.

Do not put domain logic in route handlers, ORM models, or prompt text.

## SOLID in practice

- Single Responsibility: each module should have one reason to change.
- Open/Closed: extend behavior via new services, strategies, or policies instead of modifying unrelated code.
- Liskov Substitution: keep interfaces honest; implementations must preserve expected behavior.
- Interface Segregation: depend on small, focused contracts, not large shared service objects.
- Dependency Inversion: domain logic depends on abstractions or ports, not vendor SDK details.

Use SOLID to reduce coupling, not to justify over-engineering.

## Coding rules

- Prefer typed request and response schemas for every API boundary.
- Keep functions short and intention-revealing.
- Prefer pure domain functions where possible.
- Isolate external providers behind service adapters.
- Avoid shared mutable state.
- Keep async flows explicit and predictable.
- Validate input early and normalize data once.
- Return structured errors, not ad hoc strings.
- Log identifiers and decision points, never secrets or unnecessary patient data.

## REST API conventions

- Use plural, resource-oriented paths: `/patients`, `/appointments`, `/records`.
- Use nouns in URLs, not verbs.
- Use HTTP methods semantically: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`.
- Keep request and response shapes consistent across endpoints.
- Use pagination for list endpoints.
- Use filtering and sorting via query parameters.
- Use idempotency where retries are likely for writes.
- Version APIs deliberately when breaking changes are introduced.
- Prefer ISO 8601 timestamps and UUID identifiers.

## HTTP status rules

- `200` for successful reads and updates.
- `201` for successful creation.
- `202` for accepted async work.
- `204` for successful deletion with no response body.
- `400` for malformed requests.
- `401` for unauthenticated access.
- `403` for authenticated but unauthorized access.
- `404` when the resource does not exist or is not visible.
- `409` for state conflicts.
- `422` for validation failures.
- `429` for rate limiting.
- `500` only for unexpected server failures.

## Error response standard

Return structured error payloads with stable fields:

```json
{
	"code": "validation_error",
	"message": "Input failed validation.",
	"details": {},
	"request_id": "..."
}
```

Error messages should be clear for clients and useful for operators.

## AI and agent rules

- Keep each agent narrow, explicit, and testable.
- Use structured outputs whenever possible.
- Validate model output before persistence or downstream actions.
- Keep deterministic safety and workflow rules outside the model.
- Never present AI output as a final diagnosis.
- Never prescribe medication autonomously.
- Escalate to a clinician when risk, ambiguity, or confidence thresholds require it.
- Store enough context for auditability: inputs, outputs, validations, and approvals.

## Data and privacy rules

- Minimize stored PHI and PII.
- Separate raw source material from normalized clinical data.
- Track provenance for extracted or AI-generated fields where practical.
- Do not log secrets, tokens, or raw sensitive payloads.
- Design for role-based access and clinic-level isolation.

## Testing standard

- Add unit tests for domain rules and policy decisions.
- Add integration tests for API contracts and persistence behavior.
- Add focused tests for agent output validation and escalation paths.
- Test failure paths, not only happy paths.
- Prefer deterministic tests over broad mocks when possible.

## Review checklist

- Is the route thin?
- Is the domain rule in the right layer?
- Are schemas explicit and typed?
- Is the external provider hidden behind a service boundary?
- Are error responses consistent?
- Are privacy and audit concerns handled?
- Is clinician review preserved where needed?
- Is the change small, readable, and easy to test?

## Avoid

- Fat controllers.
- Business logic in prompts.
- Leaky vendor SDK calls across the codebase.
- Generic utility layers with unclear ownership.
- Silent exception swallowing.
- Returning inconsistent payload shapes.
- Mixing persistence models directly with public API contracts.
