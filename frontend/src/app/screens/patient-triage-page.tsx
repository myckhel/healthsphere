import { ArrowRight, Globe2, Keyboard, MicOff, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { patientLanguages } from "@/app/app-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StatusPill } from "@/shared/ui/status-pill";
import { useAppStore } from "@/shared/state/app-store";

export function PatientTriagePage() {
  const preferredLanguage = useAppStore(
    (state) => state.patientDraft.preferredLanguage,
  );
  const setPreferredLanguage = useAppStore(
    (state) => state.setPreferredLanguage,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Patient triage kiosk
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Begin intake in a familiar language, then move into the live clinic
            workflow.
          </h2>
        </div>

        <div className="rounded-[1.5rem] border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Select language
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {patientLanguages.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setPreferredLanguage(language)}
                className={
                  language === preferredLanguage
                    ? "inline-flex rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                    : "inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                }
              >
                {language}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Intake entrypoint
              </p>
              <h3 className="mt-1 text-2xl text-ink">
                Real keyboard-first intake for the current MVP
              </h3>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-6 text-muted">
            <div className="rounded-[1.5rem] bg-brand-soft/70 px-4 py-4 text-ink">
              The patient flow starts with registration, then creates a triage
              case against the backend queue. The previous fake chat transcript
              has been removed so the screen does not imply unsupported voice or
              agent behavior.
            </div>
            <div className="rounded-[1.5rem] bg-white px-4 py-4">
              Preferred language is carried into onboarding and consultation
              context, but the actual symptom capture path for this MVP is typed
              intake.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild>
              <Link to="/patient/onboarding">
                <Keyboard className="h-4 w-4" />
                Start typed intake
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-line bg-white px-4 py-4 text-sm font-semibold text-muted"
            >
              <MicOff className="h-4 w-4" />
              Voice capture unavailable
            </button>
          </div>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="The kiosk now routes into the same real intake flow"
            tone="success"
            icon={<UsersRound className="h-4 w-4 text-success" />}
          >
            Language choice stays visible here, but queue placement only happens
            after a triage case is created from the actual intake form.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Supported path
                </p>
                <h3 className="mt-2 text-2xl text-ink">
                  Registration to queue
                </h3>
              </div>
              <StatusPill tone="success">Live workflow</StatusPill>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Intake mode
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  Typed intake only
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Language in use
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {preferredLanguage}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.25rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
                Use this page as a simple language-first entrypoint on a shared
                device before handing the patient into onboarding.
              </div>
              <div className="rounded-[1.25rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
                Unsupported voice capture stays disabled so the app does not
                mislead staff or patients about what is operational today.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
