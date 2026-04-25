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

  const isReceptionRoute = location.pathname.startsWith("/reception");
  const isPatientRoute = location.pathname.startsWith("/patient");
  const isPhysicianRoute = location.pathname.startsWith("/physician");
  const isOutreachRoute = location.pathname.startsWith("/outreach");

  const routeStatus = isReceptionRoute
    ? {
        label: "Manual record review",
        detail:
          "Front-desk staff can register patients and approve captured records from the API-backed queue.",
        tone: "review" as const,
      }
    : isPhysicianRoute
      ? {
          label: "Consultation workflow",
          detail:
            "Queue status, records, and clinician notes stay in sync with the backend contract.",
          tone: "success" as const,
        }
      : isOutreachRoute
        ? {
            label: "Scoped for later",
            detail:
              "Follow-up automation is not enabled in this MVP, so this surface stays informational.",
            tone: "review" as const,
          }
        : location.pathname === "/patient/next-steps"
          ? {
              label: "Queue confirmed",
              detail:
                "The patient's live queue status is pulled from the backend and refreshed through React Query.",
              tone: "review" as const,
            }
          : {
              label: "Clinic MVP",
              detail:
                "The app is focused on real intake, queue, consultation, and record-review workflows.",
              tone: "info" as const,
            };

  const routeLabel = isReceptionRoute
    ? "Reception operations"
    : isPhysicianRoute
      ? "Physician workspace"
      : isOutreachRoute
        ? "Outreach scope"
        : isPatientRoute
          ? "Patient journey"
          : "Clinic operations overview";

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
                <StatusPill tone="neutral">Functional frontend MVP</StatusPill>
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
              to="/reception/dashboard"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive || isReceptionRoute
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Reception
            </NavLink>

            <NavLink
              to="/patient/triage"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive || isPatientRoute
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Patient triage
            </NavLink>

            <NavLink
              to="/physician/dashboard"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive || isPhysicianRoute
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Physician
            </NavLink>

            <NavLink
              to="/outreach/dashboard"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive || isOutreachRoute
                    ? "bg-brand text-white shadow-brand"
                    : "bg-white/85 text-ink hover:bg-brand-soft",
                )
              }
            >
              Outreach
            </NavLink>
          </nav>
        </header>

        <main className="min-w-0 flex-1 py-2">
          <Outlet />
        </main>

        <footer className="pb-4 text-sm text-muted">
          HealthSphere keeps records, triage suggestions, and consultation notes
          visible for human review. Unsupported capabilities stay clearly out of
          scope instead of being implied in the UI.
        </footer>
      </div>
    </div>
  );
}
