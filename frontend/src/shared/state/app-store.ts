import { create } from "zustand";
import type { PatientIntakeValues } from "@/features/patients/intake/schema";

type AppState = {
  clinicName: string;
  preferredSurface: "patient" | "staff";
  intakeDraft: Partial<PatientIntakeValues>;
  setPreferredSurface: (surface: "patient" | "staff") => void;
  saveIntakeDraft: (draft: Partial<PatientIntakeValues>) => void;
  clearIntakeDraft: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  clinicName: "Maitama Community Health Centre",
  preferredSurface: "patient",
  intakeDraft: {},
  setPreferredSurface: (preferredSurface) => set({ preferredSurface }),
  saveIntakeDraft: (intakeDraft) => set({ intakeDraft }),
  clearIntakeDraft: () => set({ intakeDraft: {} }),
}));
