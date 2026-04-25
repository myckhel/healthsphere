import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/app/layouts/app-shell";
import { HomePage } from "@/app/screens/home-page";
import { OutreachDashboardPage } from "@/app/screens/outreach-dashboard-page";
import { PatientOnboardingPage } from "@/app/screens/patient-onboarding-page";
import { PatientIntakePage } from "@/app/screens/patient-intake-page";
import { PatientNextStepsPage } from "@/app/screens/patient-next-steps-page";
import { PatientTriagePage } from "@/app/screens/patient-triage-page";
import { PhysicianDashboardPage } from "@/app/screens/physician-dashboard-page";
import { PhysicianQueuePage } from "@/app/screens/physician-queue-page";
import { PhysicianConsultationPage } from "@/app/screens/physician-consultation-page";
import { PhysicianConsultationActivePage } from "@/app/screens/physician-consultation-active-page";
import { PhysicianConsultationOutcomePage } from "@/app/screens/physician-consultation-outcome-page";
import { ReceptionDashboardPage } from "@/app/screens/reception-dashboard-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "reception/dashboard",
        element: <ReceptionDashboardPage />,
      },
      {
        path: "patient/triage",
        element: <PatientTriagePage />,
      },
      {
        path: "patient/onboarding",
        element: <PatientOnboardingPage />,
      },
      {
        path: "physician/dashboard",
        element: <PhysicianDashboardPage />,
      },
      {
        path: "patient/intake",
        element: <PatientIntakePage />,
      },
      {
        path: "patient/next-steps",
        element: <PatientNextStepsPage />,
      },
      {
        path: "physician/queue",
        element: <PhysicianQueuePage />,
      },
      {
        path: "physician/consultation/:consultationId",
        element: <PhysicianConsultationPage />,
      },
      {
        path: "physician/consultation/:consultationId/active",
        element: <PhysicianConsultationActivePage />,
      },
      {
        path: "physician/consultation/:consultationId/outcome",
        element: <PhysicianConsultationOutcomePage />,
      },
      {
        path: "outreach/dashboard",
        element: <OutreachDashboardPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
