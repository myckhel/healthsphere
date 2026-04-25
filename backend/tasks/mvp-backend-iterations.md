# Backend MVP Iterations

This file tracks the implementation order for the backend MVP so the API is shaped around the current frontend patient and physician flows.

## Iteration 0: Contract Freeze

- Map each frontend route to one backend endpoint.
- Freeze payloads for patient onboarding, complaint intake, queue, consultation context, consultation update, consultation completion, and record upload.
- Keep all AI outputs draft-only and clinician-reviewed.

Checklist:

- [ ] Patient onboarding contract defined
- [ ] Intake contract defined
- [ ] Queue contract defined
- [ ] Consultation contract defined
- [ ] Outcome contract defined
- [ ] Record upload contract defined

## Iteration 1: Persistence Foundation

- Add consultation sessions.
- Add retrieval chunk storage for patient-record embeddings.
- Add explicit workflow statuses and review-state transitions.
- Keep auditability attached to all major entities.

Checklist:

- [x] Consultation sessions model and API scaffolded
- [x] Retrieval chunk model added
- [x] Review-state transitions documented in code
- [x] Audit events wired for all new writes

## Iteration 2: Frontend-Critical APIs

- Implement patient create and lookup.
- Implement complaint intake submit and queue list.
- Implement consultation create, read, update, and completion.
- Implement record create, read, list, and review actions.

Checklist:

- [x] Patient endpoints persist data
- [x] Triage endpoints persist data
- [x] Queue endpoint returns physician-ready cards
- [x] Consultation endpoints support frontend flow
- [x] Record endpoints support physician review

## Iteration 3: Agent Runtime

- Wire OpenAI Agents SDK with structured outputs only.
- Add narrow agents for intake normalization, triage support, consultation support, and record digitization.
- Use tools for patient lookup, record retrieval, clinic policy lookup, and deterministic red-flag evaluation.

Checklist:

- [x] Agent runtime configured
- [x] Structured outputs validated
- [x] Tool boundaries implemented
- [x] Agent outputs stored as drafts only

## Iteration 4: Record Upload And Retrieval

- Add a separate patient-record upload module.
- Persist uploads, OCR output, structured record data, chunks, and embeddings.
- Support patient-scoped semantic retrieval with clinic isolation.

Checklist:

- [x] Upload endpoint persists ingestion job
- [x] OCR boundary implemented
- [x] Record chunks stored
- [x] Embeddings generated
- [x] Retrieval ranked by patient, recency, and similarity

## Iteration 5: Physician Assist Workflow

- Build complaint-to-draft-assessment flow.
- Return patient snapshot, retrieved context, and AI draft package to the physician workspace.
- Require explicit clinician review before finalizing assessment and next action.

Checklist:

- [ ] Draft assessment package generated
- [ ] Consultation workspace returns retrieved context
- [ ] Clinician edits persisted
- [ ] Final assessment stored as clinician-reviewed

## Iteration 6: Guardrails And Cost Controls

- Enforce clinic isolation.
- Enforce token budgets and bounded retrieval.
- Add PHI-safe logging, rate limiting, and audit events.
- Keep urgent escalation deterministic.

Checklist:

- [ ] Clinic-scoped queries enforced
- [ ] Token budget controls added
- [ ] Rate limits added to expensive endpoints
- [ ] Audit trail complete
- [ ] High-risk escalation enforced outside prompts

## Iteration 7: Follow-Up Tasks

- Persist follow-up, discharge, referral, and nurse-handoff outcomes.
- Create follow-up tasks without requiring full scheduling automation.

Checklist:

- [ ] Next-action tasks persisted
- [ ] Outcome payload supports frontend display
- [ ] Scheduling remains optional and bounded

## Iteration 8: Verification

- Add integration tests.
- Add retrieval tests.
- Add agent contract tests.
- Verify the full onboarding-to-outcome loop against the frontend.

Checklist:

- [ ] Integration tests added
- [ ] Retrieval tests added
- [ ] Agent contract tests added
- [ ] Manual walkthrough completed
