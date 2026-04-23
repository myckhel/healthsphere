export const patientFlowSteps = [
  "Basics",
  "Symptoms",
  "Next steps",
] as const;

export const patientLanguages = [
  "English",
  "Hausa",
  "Yoruba",
  "Igbo",
] as const;

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

export const homeHighlights = [
  {
    title: "Patient onboarding",
    body: "A short intake path that works on phones, tablets, and shared clinic devices.",
  },
  {
    title: "Consultation handoff",
    body: "The physician view starts with only the context needed to begin care safely.",
  },
  {
    title: "Low-bandwidth clarity",
    body: "Status remains visible so the product feels dependable even on weak networks.",
  },
] as const;

export const patientFlowSummary = [
  "Choose language and share only the information needed for the visit.",
  "Describe symptoms in plain language instead of completing a long form.",
  "See clear next steps and expected queue status after submission.",
] as const;

export const physicianFlowSummary = [
  "Review the next patient without opening multiple views.",
  "See a concise patient snapshot before the consultation begins.",
  "Treat AI notes as draft support, never as final diagnosis.",
] as const;

export const physicianChecklist = [
  "Confirm the patient identity and preferred language.",
  "Ask follow-up questions for red-flag symptoms before reviewing the draft note.",
  "Use the AI summary as a starting point, then document the final clinical judgment yourself.",
] as const;