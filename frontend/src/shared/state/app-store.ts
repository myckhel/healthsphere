import { create } from "zustand";

export type PatientDraft = {
  firstName: string;
  lastName: string;
  externalId: string;
  phoneNumber: string;
  preferredLanguage: string;
  visitType: string;
  dateOfBirth: string;
  sexAtBirth: string;
  consentGranted: boolean;
  notes: string;
};

export type IntakeDraft = {
  presentingComplaint: string;
  symptomDuration: string;
  symptomsText: string;
  urgencyLevel: string;
};

type AppState = {
  clinicName: string;
  clinicianName: string;
  patientDraft: PatientDraft;
  intakeDraft: IntakeDraft;
  selectedPatientId: string | null;
  selectedTriageCaseId: string | null;
  activeConsultationId: string | null;
  selectedRecordId: string | null;
  updatePatientDraft: (draft: Partial<PatientDraft>) => void;
  updateIntakeDraft: (draft: Partial<IntakeDraft>) => void;
  setPreferredLanguage: (language: string) => void;
  setSelectedPatientId: (patientId: string | null) => void;
  setSelectedTriageCaseId: (triageCaseId: string | null) => void;
  setActiveConsultationId: (consultationId: string | null) => void;
  setSelectedRecordId: (recordId: string | null) => void;
  setClinicianName: (clinicianName: string) => void;
  resetVisitFlow: () => void;
};

const defaultPatientDraft: PatientDraft = {
  firstName: "Amina",
  lastName: "Bello",
  externalId: "",
  phoneNumber: "+234 803 000 0142",
  preferredLanguage: "English",
  visitType: "General consultation",
  dateOfBirth: "",
  sexAtBirth: "female",
  consentGranted: true,
  notes: "",
};

const defaultIntakeDraft: IntakeDraft = {
  presentingComplaint: "Im feeling weak, headache, high temperature, vomiting",
  symptomDuration: "2-3 days",
  symptomsText: "Fever, headache, weakness",
  urgencyLevel: "routine",
};

export const useAppStore = create<AppState>((set) => ({
  clinicName: "Maitama Community Health Centre",
  clinicianName: "Dr. Sadiq Musa",
  patientDraft: defaultPatientDraft,
  intakeDraft: defaultIntakeDraft,
  selectedPatientId: null,
  selectedTriageCaseId: null,
  activeConsultationId: null,
  selectedRecordId: null,
  updatePatientDraft: (draft) =>
    set((state) => ({
      patientDraft: {
        ...state.patientDraft,
        ...draft,
      },
    })),
  updateIntakeDraft: (draft) =>
    set((state) => ({
      intakeDraft: {
        ...state.intakeDraft,
        ...draft,
      },
    })),
  setPreferredLanguage: (preferredLanguage) =>
    set((state) => ({
      patientDraft: {
        ...state.patientDraft,
        preferredLanguage,
      },
    })),
  setSelectedPatientId: (selectedPatientId) => set({ selectedPatientId }),
  setSelectedTriageCaseId: (selectedTriageCaseId) =>
    set({ selectedTriageCaseId }),
  setActiveConsultationId: (activeConsultationId) =>
    set({ activeConsultationId }),
  setSelectedRecordId: (selectedRecordId) => set({ selectedRecordId }),
  setClinicianName: (clinicianName) => set({ clinicianName }),
  resetVisitFlow: () =>
    set({
      patientDraft: defaultPatientDraft,
      intakeDraft: defaultIntakeDraft,
      selectedPatientId: null,
      selectedTriageCaseId: null,
      activeConsultationId: null,
      selectedRecordId: null,
    }),
}));
