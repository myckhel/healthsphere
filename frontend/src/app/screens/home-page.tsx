import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import {
  homeHighlights,
  patientFlowSummary,
  physicianFlowSummary,
} from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

export function HomePage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="surface-grid overflow-hidden">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="info">Healthcare UX MVP</StatusPill>
              <StatusPill tone="success">Patient and physician only</StatusPill>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-xl text-4xl leading-tight text-ink sm:text-[3.2rem]">
                A clear, low-bandwidth care journey that starts with the patient
                and ends with the physician ready to begin.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
                HealthSphere keeps the interface calm, readable, and operational
                for clinics in Nigeria. This prototype shows only the essential
                MVP surfaces needed to explain the product without backend
                complexity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/patient/onboarding">
                  Start patient flow
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="secondary" asChild>
                <Link to="/physician/queue">
                  Open physician view
                  <Stethoscope className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              Prototype focus
            </p>
            <h3 className="text-2xl text-ink">
              Only the essential HealthSphere modules for first contact and
              consultation start.
            </h3>
          </div>

          <div className="space-y-4">
            {homeHighlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-[1.5rem] border border-line bg-white/75 px-4 py-4"
              >
                <p className="text-sm font-semibold text-ink">
                  {highlight.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {highlight.body}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-3">
          <HeartPulse className="h-8 w-8 text-brand" />
          <h3 className="text-xl text-ink">Patient onboarding</h3>
          <p className="text-sm leading-6 text-muted">
            A short, touch-friendly flow for identity, language, and visit
            intent.
          </p>
        </Card>

        <Card className="space-y-3">
          <ShieldCheck className="h-8 w-8 text-info" />
          <h3 className="text-xl text-ink">Safe AI positioning</h3>
          <p className="text-sm leading-6 text-muted">
            Any AI-generated content stays clearly marked as draft support for
            clinician review.
          </p>
        </Card>

        <Card className="space-y-3">
          <Stethoscope className="h-8 w-8 text-success" />
          <h3 className="text-xl text-ink">Consultation readiness</h3>
          <p className="text-sm leading-6 text-muted">
            The physician sees the next patient, the reason for the visit, and a
            compact draft note in one place.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Patient journey
            </p>
            <h3 className="text-2xl text-ink">What the patient experiences</h3>
          </div>

          <div className="space-y-3">
            {patientFlowSummary.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.5rem] bg-white/70 px-4 py-4"
              >
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                <p className="text-sm leading-6 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Physician journey
            </p>
            <h3 className="text-2xl text-ink">What the physician sees first</h3>
          </div>

          <div className="space-y-3">
            {physicianFlowSummary.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.5rem] bg-white/70 px-4 py-4"
              >
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-info" />
                <p className="text-sm leading-6 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
