# HealthSphere MVP Product Design

## Product Goal

HealthSphere is a low-complexity virtual health platform for clinics and patients in Nigeria. This MVP prototype focuses on the smallest usable frontend surface that can explain the product clearly, reduce friction, and support safe clinical workflows.

This document covers UI and UX only. It does not assume backend logic, live AI, or production integrations.

## MVP Scope

### In scope

- Patient onboarding
- Patient consultation request and symptom capture
- Physician queue overview
- Physician consultation start workspace
- Shared navigation, status visibility, and low-bandwidth guidance

### Out of scope for this MVP

- Receptionist OCR workflow
- Nurse outreach workflow
- Real authentication
- Real queue logic
- Real audio capture or ambient transcription
- Backend persistence
- Messaging integrations

## Target Users

### Primary user

- Patients using a phone, tablet kiosk, or shared clinic device

### Secondary user

- Physicians reviewing patient context and starting consultations quickly

## Core Modules

Only the minimum modules needed for a usable MVP are included.

### 1. Access and Role Entry

- Lets a user start as a patient or switch to the physician view
- Keeps role selection obvious without introducing full auth complexity

### 2. Patient Onboarding

- Captures preferred language, name, phone number, and consent
- Keeps the form short and touch-friendly

### 3. Consultation Request

- Lets the patient describe symptoms in a conversational way
- Uses short prompts instead of long medical forms

### 4. Visit Confirmation

- Shows next steps, queue expectation, and what the clinic will do next
- Reduces uncertainty after submission

### 5. Physician Consultation Start

- Shows a compact queue overview
- Opens a focused consultation workspace with patient summary and an AI draft note clearly labeled as a draft

### 6. System Status

- Makes sync and connectivity state visible at all times
- Reinforces that the platform works reliably in low-bandwidth environments

## User Flows

## A. Patient Onboarding Flow

1. Patient opens HealthSphere and chooses the patient path.
2. Patient sees a short explanation of what the clinic needs and why.
3. Patient enters name, phone number, preferred language, and visit type.
4. Patient confirms consent for the clinic to use the information during the visit.
5. Patient continues to symptom intake.
6. Patient receives a clear next-step screen showing queue status and what to expect.

### Key UX intent

- Limit typing to only essential data.
- Avoid medical jargon.
- Keep one primary action per screen.

## B. Starting Consultation Flow

1. Physician opens the physician view.
2. Physician sees the next patients waiting and their visit reasons.
3. Physician selects the next patient.
4. Physician lands on a consultation workspace with a patient snapshot, symptom summary, safety banner, and AI-generated draft note.
5. Physician begins the consultation with full awareness that AI output is assistive and not a diagnosis.

### Key UX intent

- Make the next patient obvious.
- Reduce scanning time.
- Keep review and accountability visible.

## Wireframe Structure

These are low-fidelity layout descriptions for the prototype screens.

## 1. Home or Role Entry

### Header

- HealthSphere logo or wordmark
- Clinic name
- Sync status indicator

### Navigation

- Simple top links: Home, Patient Flow, Physician View

### Content

- Short product statement
- Two large entry cards: Patient, Physician
- Brief explanation of the MVP scope

### Primary actions

- Start patient onboarding
- Open physician workspace

## 2. Patient Onboarding

### Header

- Back button
- Screen title
- Current sync state

### Navigation

- Progress indicator with step labels

### Content

- Short trust message about privacy and clinic use
- Language selection buttons
- Name field
- Phone field
- Visit type selection
- Consent checkbox or acknowledgment

### Primary actions

- Continue to symptom intake

## 3. Patient Symptom Intake

### Header

- Back button
- Step title

### Navigation

- Progress indicator

### Content

- Chat-style prompt blocks for short, guided questions
- Large text area for symptoms or reason for visit
- Voice-first affordance shown as a large button, even if not live in this prototype

### Primary actions

- Review next steps

## 4. Patient Confirmation

### Header

- Minimal top bar
- Sync status

### Navigation

- No complex nav; just back and home access

### Content

- Queue number or waiting status
- Visit summary card
- What happens next card
- Reassurance and clinic instructions

### Primary actions

- Return home
- Open physician handoff demo

## 5. Physician Queue Overview

### Header

- HealthSphere logo
- Physician view label
- Sync status

### Navigation

- Simple top links and a compact queue filter strip if needed

### Content

- Summary metrics kept minimal
- Cards for waiting patients
- Visit reason, wait time, and readiness status per card

### Primary actions

- Open next consultation

## 6. Physician Consultation Workspace

### Header

- Patient name
- Consultation state
- Back to queue

### Navigation

- No deep tabs for MVP

### Content

- Patient snapshot card
- Reason for visit card
- Safety or review banner
- AI draft note card labeled clearly as draft
- Primary consultation controls

### Primary actions

- Start consultation
- Review note
- Return to queue

## Design Principles

### Minimal cognitive load

- Keep each screen focused on one task.
- Avoid long forms and dense dashboards.
- Use plain-language labels.

### Clear hierarchy

- Use one strong headline per screen.
- Keep primary actions visually dominant.
- Put supporting detail in cards or banners instead of long paragraphs.

### Touch-friendly interaction

- Use large buttons and inputs.
- Keep controls easy to tap on shared tablets and lower-end phones.
- Avoid hidden gestures and tiny icons as the only interaction method.

### Accessibility

- Maintain readable font sizes.
- Keep contrast high.
- Use text and icons together for status.
- Support keyboard navigation for core actions.

### Healthcare safety

- Never present AI as final diagnosis.
- Keep review states visible.
- Use calm, direct language instead of technical or exaggerated copy.

## UI Component System

The MVP should rely on a small reusable component set.

### Buttons

- Primary button for continue, start, and confirm actions
- Secondary button for alternate navigation
- Ghost button for low-priority actions

### Cards

- Summary card for patient snapshot and next steps
- Queue card for physician overview
- Note card for AI draft output

### Input fields

- Standard text input for name and phone number
- Large textarea for symptom description
- Large selection buttons for language and visit type

### Chat interface

- Simple conversational message blocks
- Clear distinction between HealthSphere prompts and patient input

### Notification elements

- Info banner for privacy and workflow guidance
- Safety banner for AI review labeling
- Status pill for sync, queue state, and readiness

### Progress indicator

- Small horizontal step tracker for the patient flow

## Navigation Design

Navigation must remain intuitive for non-technical users.

### Principles

- Keep top-level navigation shallow.
- Always show a clear way back.
- Avoid nested menus and complex sidebars.
- Keep patient and physician surfaces visually distinct but structurally similar.

### Proposed navigation model

- Persistent top bar across the prototype
- Three top-level links only: Home, Patient Flow, Physician View
- In-flow progress indicator on patient screens
- One primary action per screen

## MVP Screen List

The full prototype stays under 10 screens.

1. Home or role entry
2. Patient onboarding
3. Patient symptom intake
4. Patient confirmation
5. Physician queue overview
6. Physician consultation workspace

## UX Optimization

### Reduce friction

- Ask only for information required to start care.
- Use one-column layouts on patient screens.
- Keep the physician queue visually scannable.

### Eliminate unnecessary steps

- Do not require account creation for the prototype.
- Do not split onboarding into more screens than needed.
- Do not force the physician through multiple tabs before seeing the patient context.

### Speed up task completion

- Prefill or suggest common visit reasons where helpful.
- Use short confirmation language after patient submission.
- Put the next patient card at the top of the physician view.

### Support low-bandwidth use

- Keep content lightweight.
- Show sync state explicitly.
- Avoid media-heavy screens and complex motion.

## Visual Direction

### Color palette

- Calm teal or green as the primary brand color
- Soft off-white and pale mint backgrounds for a clean clinical feel
- Warm warning color for review states
- Strong but restrained red only for urgent attention

### Typography

- Readable sans-serif for body copy
- Distinct but restrained display type for headings
- Large line height and generous spacing for clarity

### Icon style

- Simple outlined icons
- Use icons to reinforce labels, not replace them

## Deferred Modules After MVP

These are intentionally not part of the first prototype but should inform later design phases.

- Receptionist OCR intake and structured record verification
- Nurse outreach dashboard
- Appointment booking and reminders
- Full health records view
- Real multilingual translation flows
- Authentication and role-based permissions

## Success Criteria

- A patient can move from onboarding to a clear next-step screen without confusion.
- A physician can identify the next patient and open the consultation workspace quickly.
- Every AI element is clearly labeled as assistive.
- The prototype remains lightweight, readable, and accessible on mobile and desktop.