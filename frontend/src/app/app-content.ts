export const patientFlowSteps = ["Identity", "Intake", "Queue"] as const;

export const patientLanguages = ["English", "Hausa", "Yoruba", "Igbo"] as const;

export const visitTypes = [
  "General consultation",
  "Fever or pain",
  "Follow-up visit",
] as const;

export const symptomDurations = [
  "Today",
  "2-3 days",
  "More than a week",
] as const;

export const homeWorkflowCards = [
  {
    title: "Reception workflow",
    body: "Register patients, capture manual records, and keep human review visible before approval.",
    route: "/reception/dashboard",
    badge: "Front desk",
    tone: "success" as const,
  },
  {
    title: "Patient intake",
    body: "Collect essentials, capture symptoms in plain language, and place the patient into the live queue.",
    route: "/patient/triage",
    badge: "Patient journey",
    tone: "info" as const,
  },
  {
    title: "Physician queue",
    body: "Open the next case, review records, and move the consultation forward with persisted notes.",
    route: "/physician/queue",
    badge: "Clinical staff",
    tone: "success" as const,
  },
  {
    title: "Outreach scope",
    body: "Follow-up automation is not active in this MVP, so this area stays operationally scoped and explicit.",
    route: "/outreach/dashboard",
    badge: "Follow-up",
    tone: "review" as const,
  },
] as const;

export const homeHighlights = [
  {
    title: "Backend-backed workflow state",
    body: "Patients, triage cases, consultations, and records now come from the API instead of a local-only walkthrough store.",
  },
  {
    title: "Clear human review gates",
    body: "Record review and consultation sign-off stay visible so staff can act safely under real clinic pressure.",
  },
  {
    title: "Low-friction clinic flow",
    body: "Each screen focuses on the next safe action so staff and patients can move forward quickly on phones or shared desks.",
  },
] as const;

export const physicianChecklist = [
  "Confirm patient identity and preferred language before relying on intake notes.",
  "Check danger signs before documenting a final assessment or plan.",
  "Treat draft notes as support material and keep the clinician-authored chart as the source of truth.",
] as const;

export const consultationNoteSections = [
  {
    key: "historyOfPresentIllness",
    label: "History of present illness",
    placeholder:
      "Summarize timing, symptom course, and anything that makes the complaint better or worse.",
  },
  {
    key: "redFlags",
    label: "Red flags and urgent checks",
    placeholder:
      "Record danger signs checked during the visit or state clearly when none are present.",
  },
  {
    key: "examFindings",
    label: "Exam findings",
    placeholder:
      "Capture observations, vitals, and focused findings that matter for this visit.",
  },
  {
    key: "assessment",
    label: "Clinical assessment",
    placeholder:
      "Document the clinician's assessment and keep uncertainty explicit where needed.",
  },
  {
    key: "carePlan",
    label: "Plan and treatment",
    placeholder:
      "Record advice, tests, treatment decisions, referral steps, or observation plan.",
  },
  {
    key: "followUpInstructions",
    label: "Follow-up instructions",
    placeholder:
      "Explain return precautions, timing, and what the patient should do next.",
  },
] as const;

export const consultationNextActions = [
  {
    value: "follow-up-booking",
    label: "Book follow-up",
    description: "The patient should leave with a planned follow-up visit.",
  },
  {
    value: "nurse-handoff",
    label: "Nurse handoff",
    description:
      "Move the patient to a nurse for instructions, observation, or immediate follow-on care.",
  },
  {
    value: "referral",
    label: "Specialist referral",
    description: "Escalate to another clinician or service for further review.",
  },
  {
    value: "discharge",
    label: "Discharge with guidance",
    description:
      "The patient can leave with documented advice and return precautions.",
  },
] as const;

export const recordTypeOptions = [
  "medical_card",
  "visit_note",
  "lab_result",
  "referral_note",
  "other",
] as const;

export const recordReviewOptions = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "needs_review", label: "Needs review" },
] as const;

export const urgencyOptions = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
] as const;
