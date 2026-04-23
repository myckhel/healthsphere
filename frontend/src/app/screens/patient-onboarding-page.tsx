import { useState } from "react";
import { ChevronLeft, Languages, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  patientFlowSteps,
  patientLanguages,
  visitTypes,
} from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { Input } from "@/shared/ui/input";
import { StepProgress } from "@/shared/ui/step-progress";
import { useAppStore } from "@/shared/state/app-store";

export function PatientOnboardingPage() {
  const navigate = useNavigate();
  const patientDraft = useAppStore((state) => state.patientDraft);
  const updatePatientDraft = useAppStore((state) => state.updatePatientDraft);

  const [fullName, setFullName] = useState(patientDraft.fullName);
  const [phone, setPhone] = useState(patientDraft.phone);
  const [preferredLanguage, setPreferredLanguage] = useState(
    patientDraft.preferredLanguage,
  );
  const [visitType, setVisitType] = useState(patientDraft.visitType);
  const [consentGiven, setConsentGiven] = useState(patientDraft.consentGiven);

  const canContinue =
    fullName.trim().length > 1 && phone.trim().length > 6 && consentGiven;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updatePatientDraft({
      fullName,
      phone,
      preferredLanguage,
      visitType,
      consentGiven,
    });

    navigate("/patient/intake");
  }

  return (
    <div className="space-y-6">
      <StepProgress steps={patientFlowSteps} currentStep={0} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Patient onboarding
              </p>
              <h2 className="mt-2 text-3xl text-ink">
                Start the visit with only the essentials.
              </h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/">
                <ChevronLeft className="h-4 w-4" />
                Back home
              </Link>
            </Button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-ink"
                htmlFor="full-name"
              >
                Full name
              </label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-ink"
                htmlFor="phone-number"
              >
                Phone number
              </label>
              <Input
                id="phone-number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Enter a number we can reach"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">Preferred language</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {patientLanguages.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setPreferredLanguage(language)}
                    className={
                      preferredLanguage === language
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">Visit type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {visitTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVisitType(type)}
                    className={
                      visitType === type
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-[1.5rem] border border-line bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-line text-brand"
                checked={consentGiven}
                onChange={(event) => setConsentGiven(event.target.checked)}
              />
              <span>
                I understand this information will be used only to support my
                clinic visit and handoff to the physician.
              </span>
            </label>

            <Button
              className="w-full sm:w-auto"
              disabled={!canContinue}
              type="submit"
            >
              Continue to symptoms
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="Why this screen is short"
            icon={<ShieldCheck className="h-4 w-4 text-brand" />}
          >
            HealthSphere asks only for the information needed to start care. The
            goal is to reduce waiting room friction, not add more clinic
            paperwork.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">Language-first access</h3>
                <p className="text-sm text-muted">
                  Patients should be able to begin care in the language they
                  understand best.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted">
              <p>
                Use large tap targets, one-column layout, and direct labels.
              </p>
              <p>
                Avoid long instructions, hidden menus, or unfamiliar healthcare
                terms during intake.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
