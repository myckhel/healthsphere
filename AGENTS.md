# HealthSphere AI

## Project mission

HealthSphere AI is an AI-powered virtual health centre designed for low-resource, low-bandwidth environments, with an initial focus on Nigeria and similar Sub-Saharan African contexts.

The product should help community health centres move from paper-based, reactive care to a digital, assisted, proactive care model.

Core goals:
- digitize paper records into structured patient data
- reduce front-desk and triage bottlenecks
- support clinicians during consultations without replacing them
- automate safe follow-up workflows over familiar channels like SMS and WhatsApp
- work reliably under weak connectivity and intermittent power conditions

## Product principles

- Build for real clinics, not demo-only flows.
- Keep humans in the loop for any clinically meaningful decision.
- Optimize for simple, clear, maintainable code.
- Prefer abstractions that match healthcare workflows, not generic AI demos.
- Treat patient privacy, auditability, and safety as first-class requirements.

## Clinical safety rules

- Do not present AI output as a final diagnosis.
- Do not prescribe medication autonomously.
- Do not claim certainty when the model is inferring.
- Escalate to a human clinician when confidence is low, symptoms are ambiguous, or risk is elevated.
- Preserve a review step for OCR extraction from handwritten or low-quality records.
- Design triage and follow-up flows to be clinician-assisted, not clinician-replacing.

## Architecture direction

HealthSphere AI should evolve as a modular multi-surface platform with a clear separation between patient-facing flows, staff tools, agent orchestration, and data services.

Primary capabilities:
- patient identity and access management
- appointment scheduling
- paper-to-digital record ingestion
- AI-assisted triage and routing
- clinician copilot support during consultations
- automated follow-up and outreach
- longitudinal patient records and analytics

Required platform choices already in scope:
- Clerk for authentication and user management
- OpenAI Agents SDK for agent orchestration
- Calendly API for appointment scheduling

## Architecture map

This is the expected root-level shape as the repo grows:

```text
health-centre/
├── AGENTS.md                     # Root instructions for all contributors and coding agents
├── README.md                     # Product overview, setup, and run instructions
├── docs/                         # Architecture notes, ADRs, compliance notes, workflows
├── frontend/                     # Patient and staff web application
│   ├── src/
│   ├── public/
│   └── ...
├── backend/                      # APIs, agents, domain services, background jobs
│   ├── app/
│   │   ├── api/                  # HTTP and webhook routes
│   │   ├── agents/               # Agent definitions and orchestration flows
│   │   ├── domain/               # Core healthcare business logic
│   │   ├── services/             # Integrations, scheduling, messaging, OCR, storage
│   │   ├── models/               # Persistence models
│   │   ├── schemas/              # Request/response and typed contracts
│   │   ├── jobs/                 # Async jobs, reminders, follow-up tasks
│   │   └── core/                 # Config, security, logging, shared backend utilities
│   ├── tests/
│   └── pyproject.toml
├── shared/                       # Shared types, constants, templates, prompts, schemas
├── data/                         # Local fixtures, sample records, development seeds
├── scripts/                      # Setup, seeding, migration, maintenance scripts
├── infra/                        # Deployment and infrastructure config
└── integrations/                 # Integration-specific adapters and examples
```

## Domain architecture

The backend should be organized around product workflows, not vendor SDKs.

Recommended domain slices:
- patients: demographics, identifiers, consent, contact preferences
- records: scanned documents, OCR results, structured medical history, attachments
- appointments: scheduling, Calendly sync, reminders, rescheduling
- triage: symptom intake, routing suggestions, escalation rules
- consultations: clinician notes, ambient summaries, visit outcomes
- follow_up: reminders, check-ins, outreach workflows, nurse escalation queues
- auth: Clerk session validation, role mapping, organization access
- analytics: operational metrics, no-show rates, follow-up completion, triage outcomes

## Agent architecture

Agents should be narrow, explicit, and easy to test. Avoid a single general-purpose agent.

Preferred agent roles:
- Intake Agent: structures patient-reported information into typed fields
- Record Digitization Agent: converts OCR output into normalized medical record data
- Triage Agent: suggests routing and urgency based on symptoms and policy rules
- Consultation Scribe Agent: summarizes encounters into clinician-reviewable notes
- Follow-up Agent: drafts safe, localized follow-up messages and escalation flags
- Scheduling Agent: coordinates appointment booking flows through Calendly

Agent design rules:
- keep prompts task-specific
- use structured outputs wherever possible
- validate model output before persistence or downstream actions
- log decisions and inputs needed for auditability
- keep business rules outside prompts when deterministic code is safer

## Frontend architecture

The frontend should support at least two user surfaces over time:
- patient experience: intake, appointments, messages, follow-up responses
- clinic staff experience: queue management, patient records, triage review, follow-up dashboard

Frontend priorities:
- mobile-first UX
- low-bandwidth friendly interactions
- progressive enhancement over heavy client complexity
- language-ready content and localization support from the start

## Data and interoperability rules

- Use a normalized relational data model for operational healthcare records.
- Keep raw OCR text and structured extracted data separate.
- Store provenance for extracted fields when possible.
- Design schemas to be FHIR-aligned where practical, even if full FHIR implementation comes later.
- Do not couple internal domain models directly to external provider payloads.
- Prefer explicit mapping layers for Calendly, Clerk, messaging providers, and OCR vendors.

## Privacy and compliance baseline

- Minimize stored patient data to what is operationally necessary.
- Protect PII and health data in logs, analytics, and test fixtures.
- Never commit secrets or real patient data.
- Use role-based access for staff views and actions.
- Maintain audit trails for record creation, edits, AI suggestions, and human approvals.
- Treat consent, disclosure, and retention as product features, not later clean-up work.

## Engineering rules

- Write simple, clean, minimal, readable code.
- Prefer small modules and explicit names over clever abstractions.
- Fix root causes instead of layering defensive noise everywhere.
- Keep vendor integrations behind service boundaries.
- Make local development easy with clear scripts and seed data.
- Add tests for core domain behavior and risky workflow logic.
- Add observability for latency, failures, retry behavior, and agent output validation.

## Directory ownership guidance

- Put UI code in frontend.
- Put API routes, agent orchestration, and business logic in backend.
- Put shared schemas, constants, and prompt templates in shared only if they are used across app boundaries.
- Put architecture decisions, workflow diagrams, and regulatory notes in docs.
- Put provider-specific examples or adapters in integrations if they are not part of the main runtime path.

## What to optimize for first

When building new features, prioritize this order:
1. patient safety and human review
2. reliable clinic workflows
3. low-bandwidth usability
4. maintainable architecture
5. model sophistication

## Near-term implementation path

Recommended first milestones:
1. establish frontend and backend app shells
2. wire Clerk authentication
3. create patient, appointment, and record domain models
4. integrate Calendly for scheduling flows
5. build OCR ingestion with human review
6. add a narrow triage agent with deterministic escalation rules
7. add follow-up messaging workflows
8. add analytics and operational dashboards

## Decision standard

If a choice improves demo polish but weakens safety, maintainability, privacy, or low-bandwidth reliability, reject it.

HealthSphere AI should feel like a clinic system with carefully applied AI, not an AI demo that happens to mention healthcare.
