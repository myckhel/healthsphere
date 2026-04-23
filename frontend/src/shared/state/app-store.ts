import { create } from "zustand";

export type PatientDraft = {
  fullName: string;
  phone: string;
  preferredLanguage: string;
  visitType: string;
  symptoms: string;
  symptomDuration: string;
  consentGiven: boolean;
};

type AppState = {
  clinicName: string;
  patientDraft: PatientDraft;
  updatePatientDraft: (draft: Partial<PatientDraft>) => void;
  resetPatientDraft: () => void;
};

const defaultPatientDraft: PatientDraft = {
  fullName: "Amina Bello",
  phone: "+234 803 000 0142",
  preferredLanguage: "English",
  visitType: "General consultation",
  symptoms:
    "Fever and headache for three days. Feeling weaker since yesterday.",
  symptomDuration: "2-3 days",
  consentGiven: true,
};

export const useAppStore = create<AppState>((set) => ({
  clinicName: "Maitama Community Health Centre",
  patientDraft: defaultPatientDraft,
  updatePatientDraft: (draft) =>
    set((state) => ({
      patientDraft: {
        ...state.patientDraft,
        ...draft,
      },
    })),
  resetPatientDraft: () =>
    set({
      patientDraft: defaultPatientDraft,
    }),
}));
