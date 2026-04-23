import { create } from "zustand";

export type PatientDraft = {
  fullName: string;
  patientId: string;
  phone: string;
  preferredLanguage: string;
  visitType: string;
  symptoms: string;
  symptomDuration: string;
  consentGiven: boolean;
};

export type ConsultationStatus = "idle" | "in-progress" | "completed";

export type ConsultationNextAction =
  | "follow-up-booking"
  | "nurse-handoff"
  | "referral"
  | "discharge";

export type ConsultationDraft = {
  historyOfPresentIllness: string;
  redFlags: string;
  examFindings: string;
  assessment: string;
  carePlan: string;
  followUpInstructions: string;
};

export type ConsultationSession = {
  clinicianName: string;
  status: ConsultationStatus;
  startedAt: string | null;
  completedAt: string | null;
  nextAction: ConsultationNextAction | null;
};

type AppState = {
  clinicName: string;
  patientDraft: PatientDraft;
  consultationSession: ConsultationSession;
  consultationDraft: ConsultationDraft;
  updatePatientDraft: (draft: Partial<PatientDraft>) => void;
  startConsultation: () => void;
  updateConsultationDraft: (draft: Partial<ConsultationDraft>) => void;
  setConsultationNextAction: (nextAction: ConsultationNextAction) => void;
  completeConsultation: (nextAction: ConsultationNextAction) => void;
  resetConsultationSession: () => void;
  resetPatientDraft: () => void;
};

const defaultPatientDraft: PatientDraft = {
  fullName: "Amina Bello",
  patientId: "",
  phone: "+234 803 000 0142",
  preferredLanguage: "English",
  visitType: "General consultation",
  symptoms:
    "Fever and headache for three days. Feeling weaker since yesterday.",
  symptomDuration: "2-3 days",
  consentGiven: true,
};

const defaultConsultationDraft: ConsultationDraft = {
  historyOfPresentIllness: "",
  redFlags: "",
  examFindings: "",
  assessment: "",
  carePlan: "",
  followUpInstructions: "",
};

const defaultConsultationSession: ConsultationSession = {
  clinicianName: "Dr. Sadiq Musa",
  status: "idle",
  startedAt: null,
  completedAt: null,
  nextAction: null,
};

export const useAppStore = create<AppState>((set) => ({
  clinicName: "Maitama Community Health Centre",
  patientDraft: defaultPatientDraft,
  consultationSession: defaultConsultationSession,
  consultationDraft: defaultConsultationDraft,
  updatePatientDraft: (draft) =>
    set((state) => ({
      patientDraft: {
        ...state.patientDraft,
        ...draft,
      },
    })),
  startConsultation: () =>
    set((state) => ({
      consultationSession: {
        ...state.consultationSession,
        status: "in-progress",
        startedAt: state.consultationSession.startedAt ?? new Date().toISOString(),
        completedAt: null,
        nextAction: null,
      },
    })),
  updateConsultationDraft: (draft) =>
    set((state) => ({
      consultationDraft: {
        ...state.consultationDraft,
        ...draft,
      },
    })),
  setConsultationNextAction: (nextAction) =>
    set((state) => ({
      consultationSession: {
        ...state.consultationSession,
        nextAction,
      },
    })),
  completeConsultation: (nextAction) =>
    set((state) => ({
      consultationSession: {
        ...state.consultationSession,
        status: "completed",
        completedAt: new Date().toISOString(),
        nextAction,
      },
    })),
  resetConsultationSession: () =>
    set({
      consultationSession: defaultConsultationSession,
      consultationDraft: defaultConsultationDraft,
    }),
  resetPatientDraft: () =>
    set({
      patientDraft: defaultPatientDraft,
      consultationSession: defaultConsultationSession,
      consultationDraft: defaultConsultationDraft,
    }),
}));
