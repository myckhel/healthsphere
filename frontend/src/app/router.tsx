import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/app/layouts/app-shell";
import { HomePage } from "@/app/screens/home-page";
import { StaffOverviewPage } from "@/app/screens/staff-overview-page";
import { PatientAppointmentsPage } from "@/features/appointments/patient-appointments-page";
import { PatientIntakePage } from "@/features/patients/intake/patient-intake-page";

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
        path: "patient/intake",
        element: <PatientIntakePage />,
      },
      {
        path: "patient/appointments",
        element: <PatientAppointmentsPage />,
      },
      {
        path: "staff",
        element: <StaffOverviewPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
