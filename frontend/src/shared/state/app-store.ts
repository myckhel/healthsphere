import { create } from "zustand";

type AppState = {
  clinicName: string;
};

export const useAppStore = create<AppState>((set) => ({
  clinicName: "Maitama Community Health Centre",
}));
