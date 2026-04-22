import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/app/layouts/app-shell";
import { HomePage } from "@/app/screens/home-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
