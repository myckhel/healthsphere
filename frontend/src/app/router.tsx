import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/app/layouts/app-shell";
import { HomePage } from "@/app/screens/home-page";
import { PatientOnboardingPage } from "@/app/screens/patient-onboarding-page";
import { PatientIntakePage } from "@/app/screens/patient-intake-page";
import { PatientNextStepsPage } from "@/app/screens/patient-next-steps-page";
import { PhysicianQueuePage } from "@/app/screens/physician-queue-page";
import { PhysicianConsultationPage } from "@/app/screens/physician-consultation-page";

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
        path: "patient/onboarding",
        element: <PatientOnboardingPage />,
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
        path: "physician/consultation",
        element: <PhysicianConsultationPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
