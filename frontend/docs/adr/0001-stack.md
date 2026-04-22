# ADR 0001: Frontend stack for HealthSphere AI

## Status

Accepted

## Context

HealthSphere AI needs a frontend that supports patient-facing and staff-facing workflows in low-bandwidth environments without drifting into a generic AI demo. The current frontend started as a minimal React + Vite scaffold, so the first architectural decision is the foundational stack.

The project constraints are:

- prioritize patient safety and human review
- support mobile-first patient flows and later staff operations
- degrade cleanly under weak connectivity
- keep code simple, explicit, and maintainable
- avoid overlapping state patterns

## Decision

Use this stack for the frontend foundation:

- React 19 with TypeScript
- Vite for development and build
- React Router for route-based surfaces and workflow navigation
- TanStack Query for all server-owned state
- React Hook Form with Zod for forms and validation
- Tailwind CSS for styling tokens and utility composition
- A lightweight project-owned UI layer built from shared primitives
- Zustand only for narrow cross-app client state
- Utility libraries: clsx, tailwind-merge, class-variance-authority, date-fns, lucide-react

The UI layer should stay small and local to the app. The frontend should not adopt a heavyweight component framework at this stage.

## Rationale

### React Router

The app needs distinct patient and staff surfaces and route-based workflows. Router gives a clear place for navigation, layouts, and future auth guards.

### TanStack Query

The project needs resilient server state with retry behavior, stale data control, and clear loading and error states. Query fits those requirements better than ad hoc fetch hooks or global stores.

### React Hook Form and Zod

Intake, triage, and scheduling flows need typed validation close to the form. This reduces UI-backend mismatch and keeps forms readable.

### Tailwind CSS

The project needs a fast, consistent styling system without building a custom CSS architecture from scratch. Tailwind keeps styling local and composable while still allowing a branded design system through CSS variables and shared primitives.

### Lightweight shared UI layer

Clinic workflows need explicit states such as review, escalation, and consent. A small shared layer gives better control than a generic enterprise component framework.

### Zustand, narrowly applied

Some state is cross-app but not server-owned, such as active surface preference or an in-memory intake draft. Zustand is suitable for that narrow role. It should not become the default data layer.

## Rejected alternatives

### Redux Toolkit as the main state layer

Rejected because most application data is server-owned and better modeled in Query. Adding Redux now would increase complexity without solving a real problem.

### A large UI framework such as MUI or Ant Design

Rejected because the project needs tighter control over workflow-specific semantics, smaller bundles, and a less generic dashboard feel.

### Using only local state and fetch

Rejected because it does not scale well to retries, background refresh, partial rendering, or consistent error handling.

## Consequences

### Positive

- clear ownership boundaries for state
- strong form and payload validation
- small and understandable implementation surface
- easy path from patient-first flows to staff-facing workflows

### Tradeoffs

- more initial setup than a plain Vite app
- shared UI primitives must be maintained inside the project
- frontend teams must stay disciplined and avoid putting server state into Zustand