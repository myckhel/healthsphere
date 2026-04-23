import { CheckCircle2, ChevronLeft, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { patientFlowSteps } from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StepProgress } from "@/shared/ui/step-progress";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

export function PatientNextStepsPage() {
  const patientDraft = useAppStore((state) => state.patientDraft);

  return (
    <div className="space-y-6">
      <StepProgress steps={patientFlowSteps} currentStep={2} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Visit confirmation
              </p>
              <h2 className="mt-2 text-3xl text-ink">
                You are ready for the clinic handoff.
              </h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/patient/intake">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <InfoBanner
            title="What happens next"
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          >
            Your visit summary is ready for the care team. If the internet is
            weak, HealthSphere can still keep your details cached until the
            clinic reconnects.
          </InfoBanner>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Queue
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">04</p>
              <p className="mt-2 text-sm text-muted">General physician queue</p>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Estimated wait
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">15-20 min</p>
              <p className="mt-2 text-sm text-muted">
                A clinician will review your symptoms before speaking with you.
              </p>
            </div>
          </div>

          <Card className="bg-white/85 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit summary
                </p>
                <h3 className="mt-2 text-xl text-ink">
                  {patientDraft.fullName}
                </h3>
              </div>
              <StatusPill tone="review">Awaiting physician review</StatusPill>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Language
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.preferredLanguage}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit type
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.visitType}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Symptoms shared
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {patientDraft.symptoms}
                </dd>
              </div>
            </dl>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/physician/queue">
                Open physician handoff
                <Stethoscope className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="secondary" asChild>
              <Link to="/">Return home</Link>
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Patient reassurance
          </p>
          <h3 className="text-2xl text-ink">
            Clear next steps reduce uncertainty.
          </h3>
          <p className="text-sm leading-6 text-muted">
            Instead of ending the flow with a vague confirmation, the patient
            sees exactly what the clinic will do next, what queue they are in,
            and how the information will be used.
          </p>
          <div className="space-y-3">
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              Bring this screen to the reception desk if staff need to confirm
              your place in the queue.
            </div>
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              If symptoms worsen while waiting, the care team should escalate to
              a clinician immediately.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
