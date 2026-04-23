import { useState } from "react";
import { ChevronLeft, Mic, MessageSquareText, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { patientFlowSteps, symptomDurations } from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StepProgress } from "@/shared/ui/step-progress";
import { Textarea } from "@/shared/ui/textarea";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

export function PatientIntakePage() {
  const navigate = useNavigate();
  const patientDraft = useAppStore((state) => state.patientDraft);
  const updatePatientDraft = useAppStore((state) => state.updatePatientDraft);

  const [symptoms, setSymptoms] = useState(patientDraft.symptoms);
  const [symptomDuration, setSymptomDuration] = useState(
    patientDraft.symptomDuration,
  );

  const canContinue = symptoms.trim().length >= 12;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updatePatientDraft({
      symptoms,
      symptomDuration,
    });

    navigate("/patient/next-steps");
  }

  return (
    <div className="space-y-6">
      <StepProgress steps={patientFlowSteps} currentStep={1} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Symptom intake
              </p>
              <h2 className="mt-2 text-3xl text-ink">
                Tell the clinic what is bothering you today.
              </h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/patient/onboarding">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="rounded-[1.5rem] bg-brand-soft/70 px-4 py-4">
                <div className="flex items-center gap-2">
                  <StatusPill tone="info">HealthSphere prompt</StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink">
                  Hello {patientDraft.fullName.split(" ")[0]}. Please describe
                  your symptoms in your own words.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white px-4 py-4">
                <div className="flex items-center gap-2">
                  <StatusPill tone="neutral">Your response</StatusPill>
                </div>
                <div className="mt-3 space-y-3">
                  <Textarea
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    placeholder="For example: I have had a fever and headache for three days."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    <Mic className="h-4 w-4" />
                    Tap to speak
                  </Button>
                  <p className="text-xs text-muted">
                    Voice input is shown here as a UX placeholder only for this
                    prototype.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">
                How long have you felt this way?
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {symptomDurations.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setSymptomDuration(duration)}
                    className={
                      symptomDuration === duration
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full sm:w-auto"
              disabled={!canContinue}
              type="submit"
            >
              Review next steps
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="Patient safety stays visible"
            tone="review"
            icon={<ShieldAlert className="h-4 w-4 text-warning" />}
          >
            This screen captures symptoms in plain language, but it does not
            diagnose. High-risk or unclear cases should always move to a
            clinician quickly.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info-soft text-info">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">
                  Conversational, not overwhelming
                </h3>
                <p className="text-sm text-muted">
                  Patients should never face a long form before they can explain
                  what hurts.
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted">
              The physician will receive this text as part of a compact handoff
              summary so the consultation can begin with context already
              visible.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
