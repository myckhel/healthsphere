import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

export function AppShell() {
  const location = useLocation();
  const clinicName = useAppStore((state) => state.clinicName);
  const preferredLanguage = useAppStore(
    (state) => state.patientDraft.preferredLanguage,
  );

  const isPatientRoute = location.pathname.startsWith("/patient");
  const isPhysicianRoute = location.pathname.startsWith("/physician");

  const routeStatus = isPhysicianRoute
    ? {
        label: "Synced for consultation",
        detail: "Patient summary is ready for physician review.",
        tone: "success" as const,
      }
    : location.pathname === "/patient/next-steps"
      ? {
          label: "Syncing visit summary",
          detail: "Queue updates will refresh when the network is stable.",
          tone: "review" as const,
        }
      : {
          label: "Offline ready",
          detail: "Forms remain usable on slow or unstable connections.",
          tone: "info" as const,
        };

  const routeLabel = isPhysicianRoute
    ? "Physician workspace"
    : isPatientRoute
      ? "Patient journey"
      : "Prototype overview";

  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="rounded-panel border border-line bg-panel px-5 py-5 shadow-panel backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                  HealthSphere
                </p>
                <StatusPill tone="neutral">UI-only MVP prototype</StatusPill>
              </div>

              <div>
                <h1 className="text-2xl text-ink sm:text-3xl">{clinicName}</h1>
                <p className="mt-1 text-sm text-muted">{routeLabel}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-line bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Preferred language
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {preferredLanguage}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-line bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    System status
                  </p>
                  <StatusPill tone={routeStatus.tone}>
                    {routeStatus.label}
                  </StatusPill>
                </div>
                <p className="mt-2 text-sm text-muted">{routeStatus.detail}</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Primary">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/patient/onboarding"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive || isPatientRoute
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Patient flow
            </NavLink>

            <NavLink
              to="/physician/queue"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive || isPhysicianRoute
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Physician view
            </NavLink>
          </nav>
        </header>

        <main className="min-w-0 flex-1 py-2">
          <Outlet />
        </main>

        <footer className="pb-4 text-sm text-muted">
          This prototype shows only the patient onboarding and physician
          consultation-start experience. All AI outputs remain drafts for human
          review.
        </footer>
      </div>
    </div>
  );
}
