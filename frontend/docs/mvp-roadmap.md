# HealthSphere MVP Frontend Roadmap

This roadmap is intentionally checkable. It focuses on documentation and a clickable UI-only prototype for patient onboarding and physician consultation start.

## Scope Lock

### Included now

- Product design document
- Checkable implementation roadmap
- Clickable React prototype
- Patient onboarding flow
- Physician consultation-start flow

### Deferred now

- Backend logic
- Real auth
- Receptionist workflow
- Nurse workflow
- Persistence and APIs
- Real AI or voice features

## Phase 1: Documentation and UX Contract

### Deliverables

- [x] Define MVP scope for patient and physician only
- [x] Write product design document
- [x] Write checkable roadmap document

### Acceptance criteria

- [x] Core modules are listed and minimal
- [x] Patient onboarding flow is mapped step by step
- [x] Consultation-start flow is mapped step by step
- [x] Wireframe structure is described for each main screen
- [x] Design principles, navigation, component system, and visual direction are documented

## Phase 2: App Structure and Navigation

### Deliverables

- [x] Expand router from one screen to the MVP route set
- [x] Add a persistent app shell with status visibility
- [x] Add simple top-level navigation for Home, Patient Flow, and Physician View

### Acceptance criteria

- [x] Every prototype screen is reachable without dead ends
- [x] Back navigation is obvious on patient and physician screens
- [x] Sync or connectivity state is visible on every screen

## Phase 3: Patient Flow Prototype

### Deliverables

- [x] Build home or role entry screen
- [x] Build patient onboarding screen
- [x] Build patient symptom intake screen
- [x] Build patient confirmation screen

### Acceptance criteria

- [x] Patient flow uses large touch-friendly controls
- [x] Patient flow stays readable on narrow mobile widths
- [x] Patient flow asks only for essential MVP data
- [x] Patient confirmation screen clearly explains what happens next

## Phase 4: Physician Flow Prototype

### Deliverables

- [x] Build physician queue overview
- [x] Build physician consultation workspace

### Acceptance criteria

- [x] Physician can identify the next patient within one glance
- [x] Consultation workspace shows patient summary, visit reason, and AI draft note
- [x] AI content is clearly labeled as assistive or draft only
- [x] Physician workflow stays visually calm and non-enterprise-heavy

## Phase 5: Shared Components and Styling

### Deliverables

- [x] Reuse existing buttons, cards, inputs, textarea, and status pills
- [x] Add only the extra shared components needed for repetition
- [x] Tune spacing, hierarchy, and screen density for healthcare clarity

### Acceptance criteria

- [x] No unnecessary component sprawl
- [x] Status is never communicated by color alone
- [x] Typography stays readable across mobile and desktop
- [x] Primary actions remain obvious on every screen

## Phase 6: Verification

### Deliverables

- [x] Run lint
- [x] Run typecheck
- [x] Run build
- [ ] Manually verify full patient-to-physician prototype flow

### Acceptance criteria

- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm run build` passes
- [x] Prototype remains under 10 screens
- [x] Prototype clearly stays UI-only with no misleading backend assumptions

## Route Checklist

- [x] `/`
- [x] `/patient/onboarding`
- [x] `/patient/intake`
- [x] `/patient/next-steps`
- [x] `/physician/queue`
- [x] `/physician/consultation`

## Content Checklist

- [x] Patient copy is plain and low-jargon
- [x] Physician copy is compact and scannable
- [x] AI note is labeled draft
- [x] Safety guidance is visible where needed
- [x] Low-bandwidth status is visible throughout

## Accessibility Checklist

- [ ] Body text is readable without zooming
- [ ] Buttons and inputs are touch-friendly
- [ ] Keyboard navigation reaches core actions
- [ ] Contrast is high enough for shared clinic devices
- [ ] Status messages include text labels, not color only

## Nice-to-Have After MVP

- [ ] Receptionist intake prototype
- [ ] Nurse follow-up prototype
- [ ] Appointment reminders
- [ ] Role-aware auth shell
- [ ] Real multilingual content system