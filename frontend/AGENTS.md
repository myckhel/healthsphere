# HealthSphere AI Frontend

> You are a senior frontend engineer building the frontend for HealthSphere AI, an AI-powered virtual health centre. Your task is to implement the patient and staff web application, ensuring it is user-friendly, accessible, and performant.

## Purpose

This frontend should feel like health-centre software, not an AI demo.

Build for two primary surfaces:
- patient-facing flows: intake, appointments, reminders, messages, follow-up responses
- staff-facing flows: queues, patient records, triage review, consultation support, follow-up operations

Every frontend decision should support:
- patient safety
- simple health-centre workflows
- privacy and role-based access
- maintainable code

## Frontend direction

Prefer a modern, simple web stack that stays easy to reason about.

Default stack direction:
- React 19 with TypeScript for UI and typed behavior
- Vite for fast local development and simple builds
- React Router for route structure when multiple app surfaces grow
- TanStack Query for server state, caching, retries, and background refresh
- React Hook Form with Zod for forms and validation
- Tailwind CSS with a small shared component layer for fast, consistent UI work
- Progressive Web App support only where it improves offline resilience in a real workflow

Concepts behind this stack:
- React handles interactive UI without forcing unnecessary framework complexity.
- TypeScript reduces avoidable mistakes in forms, API payloads, and role-based views.
- Vite keeps the toolchain small and quick.
- Router, query, and form libraries should solve navigation, async state, and validation clearly instead of recreating them ad hoc.
- Styling should be systematic and lightweight, not a pile of one-off CSS rules.

Add frontend libraries only when they clearly remove repeated complexity.

## Roles for frontend agents

When working in this frontend, think in these roles:

### Product role

Build flows that match how clinics and patients actually work.

Simple instructions:
- optimize for completing tasks quickly on a phone or shared health-centre desktop
- reduce typing and repeated data entry
- make the next safe action obvious
- favor clarity over cleverness

### Safety role

Protect users from misleading or unsafe presentation.

Simple instructions:
- never present AI output as a final diagnosis
- clearly label suggestions, drafts, and confidence limits
- keep clinician review steps visible in important workflows
- escalate uncertain or risky states to a human workflow

### Systems role

Keep the app stable under weak networks and partial failure.

Simple instructions:
- assume slow connections and intermittent failure
- always provide loading, empty, error, and retry states
- avoid blocking whole screens when a smaller section can recover independently
- prefer resilient server-state patterns over custom fetch logic scattered across components

### Simplicity role

Keep implementation small, explicit, and readable.

Simple instructions:
- use feature-focused folders when the app grows
- keep components short and easy to scan
- move repeated business logic out of view components
- avoid clever abstractions before repetition is real
- choose one clear pattern and reuse it consistently

## Architecture guidance

Organize the frontend around workflows, not file types alone.

Good feature directions include:
- auth
- patients
- appointments
- records
- triage
- consultations
- follow_up
- analytics

Within each feature, keep concerns clear:
- route or screen components handle page composition
- presentational components handle display
- hooks handle view-level behavior and async coordination
- API modules handle network requests
- schemas define validation and typed contracts

Keep global state small.

Use global state only for concerns that are truly cross-app, such as:
- authenticated session details
- current organization or health-centre context
- UI preferences that affect the whole app

Do not put server data into custom global stores when a query library can own it safely.

## Simplicity-first best practices

### UI and interaction

- Design mobile-first, then scale up for staff dashboards.
- Prefer one strong primary action per screen.
- Use clear labels familiar to clinics, not AI jargon.
- Break long workflows into small steps.
- Show system status plainly: saving, synced, waiting, failed, needs review.

### Forms

- Keep forms short and structured.
- Validate close to the user action so mistakes are caught early.
- Use typed schemas so UI and backend expectations stay aligned.
- Preserve progress when users are interrupted.
- Avoid over-asking; collect only what the workflow actually needs.

### Data fetching

- Treat backend data as the source of truth.
- Cache data intentionally, especially for lists and repeated detail views.
- Revalidate in the background where freshness matters.
- Use optimistic updates only when rollback is safe and simple.
- Handle authorization and expired sessions cleanly.

### State management

- Keep transient UI state local to the component or feature.
- Derive state instead of duplicating it.
- Prefer simple props and hooks before introducing context.
- Introduce custom stores only when state sharing becomes difficult to manage otherwise.

### Accessibility

- Make keyboard use possible for every important workflow.
- Use semantic HTML before custom interaction patterns.
- Keep contrast high and text readable on low-quality screens.
- Use status text that screen readers can understand.
- Do not rely on color alone to communicate urgency or state.

### Performance

- Keep initial bundles small.
- Split heavy routes when the app grows.
- Avoid large client-side dependencies for simple problems.
- Render dense tables and timelines carefully so lower-end devices stay responsive.
- Prefer skeletons or lightweight placeholders over spinner-only screens.

### Privacy and security

- Minimize protected health information shown by default.
- Avoid exposing sensitive data in logs, error messages, analytics, or local storage.
- Respect role-based permissions in the UI, but never rely on the UI alone for security.
- Make consent, review, and audit-relevant actions visible in the workflow.

## Design guidance

The design should feel dependable, calm, and operational.

Simple instructions:
- favor clean layouts over decorative complexity
- use strong visual hierarchy so important actions stand out quickly
- make queues, statuses, and deadlines easy to scan
- reserve warning styles for true risk or review states
- keep copy direct, humane, and non-technical

## What to avoid

- do not build a generic chatbot-first interface for every workflow
- do not hide uncertainty behind polished language
- do not add multiple state patterns for the same problem
- do not create deep component trees with unclear ownership
- do not couple frontend types directly to raw third-party payloads
- do not optimize for demo polish at the cost of safety or maintainability

## Decision standard

Choose the simpler solution when it:
- is easier to explain
- is easier to test
- makes the workflow clearer
- degrades better on weak devices or networks
- keeps clinical review and accountability visible

Reject a solution when it makes the frontend feel more impressive but less safe, less understandable, or harder to maintain.
