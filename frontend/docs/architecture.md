# Frontend architecture

## Goals

The frontend should behave like clinic software with carefully applied AI support. It must be readable on phones and shared desktops, resilient on slow networks, and explicit about review steps.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- Zustand for narrow client state only

## App surfaces

### Patient surface

The first implementation wave focuses on:

- intake
- appointments
- reminders and follow-up messaging

### Staff surface

The next wave should support:

- queue management
- triage review
- records and provenance views
- consultation support

## Route structure

One frontend app should expose route-grouped surfaces rather than separate projects.

Suggested pattern:

```text
/
/patient/intake
/patient/appointments
/patient/messages
/staff
/staff/triage
/staff/records
/staff/consultations
```

## Folder structure

Use feature-first organization with a small app shell layer.

```text
frontend/src/
  app/
    layouts/
    screens/
    providers.tsx
    router.tsx
  features/
    appointments/
    patients/
      intake/
    triage/
    consultations/
    follow_up/
  shared/
    lib/
    state/
    types/
    ui/
```

## State ownership

### TanStack Query

Owns all backend data, including:

- appointment lists
- patient detail records
- staff queues
- reminders and message history

### React Hook Form

Owns form interaction state, validation lifecycle, and submission values.

### Local component state

Owns transient interface concerns such as open panels, input mode, or currently expanded cards.

### Zustand

Owns only small cross-app client state, such as:

- active surface preference
- current clinic context
- in-memory draft values that should not be persisted to local storage

Do not duplicate Query data into Zustand.

## Styling system

Use Tailwind utilities backed by CSS variables for:

- color tokens
- spacing
- radius
- focus styles
- information density

Build and maintain a small project-owned shared UI layer for:

- buttons
- cards
- inputs
- textareas
- status pills
- future workflow components such as review banners and escalation panels

## Privacy and safety rules

- do not persist protected health information to local storage by default
- show review and consent states explicitly
- never present AI-generated output as final diagnosis or autonomous care direction
- keep important workflow actions attributable and reviewable

## Rollout sequence

1. Foundation: providers, router, styling, shared primitives
2. Patient workflows: intake, appointments, reminders
3. Auth and role-aware guards
4. Staff workflows: triage, records, consultations
5. Analytics and operational dashboards