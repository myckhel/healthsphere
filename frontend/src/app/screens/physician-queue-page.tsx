import { ArrowRight, Clock3, Stethoscope, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { physicianChecklist } from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

export function PhysicianQueuePage() {
  const patientDraft = useAppStore((state) => state.patientDraft);
  const consultationSession = useAppStore((state) => state.consultationSession);

  const primaryPatientStatus =
    consultationSession.status === "in-progress"
      ? { label: "In progress", tone: "info" as const }
      : consultationSession.status === "completed"
        ? { label: "Completed", tone: "review" as const }
        : { label: "Next patient", tone: "success" as const };

  const queuePatients = [
    {
      name: patientDraft.fullName,
      waitTime: "15 min",
      visitType: patientDraft.visitType,
      summary: patientDraft.symptoms,
      status: primaryPatientStatus.label,
      tone: primaryPatientStatus.tone,
    },
    {
      name: "Grace Okon",
      waitTime: "22 min",
      visitType: "Follow-up visit",
      summary: "Medication review after a recent malaria diagnosis.",
      status: "Waiting",
      tone: "neutral" as const,
    },
    {
      name: "Musa Ibrahim",
      waitTime: "28 min",
      visitType: "General consultation",
      summary: "Stomach pain since this morning and reduced appetite.",
      status: "Waiting",
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Physician queue
            </p>
            <h2 className="text-3xl text-ink">
              See the next patient and begin with context already visible.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Waiting now
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">3</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Ready to open
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">1</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Low-bandwidth mode
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">On</p>
            </div>
          </div>

          <div className="space-y-4">
            {queuePatients.map((patient, index) => (
              <div
                key={patient.name}
                className="rounded-[1.75rem] border border-line bg-white px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl text-ink">{patient.name}</h3>
                      <StatusPill tone={patient.tone}>
                        {patient.status}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {patient.visitType}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Clock3 className="h-4 w-4" />
                    {patient.waitTime}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted">
                  {patient.summary}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link
                      to={
                        index === 0
                          ? consultationSession.status === "in-progress"
                            ? "/physician/consultation/active"
                            : consultationSession.status === "completed"
                              ? "/physician/consultation/outcome"
                              : "/physician/consultation"
                          : "/physician/consultation"
                      }
                    >
                      {index === 0
                        ? consultationSession.status === "in-progress"
                          ? "Resume consultation"
                          : consultationSession.status === "completed"
                            ? "Review completed consultation"
                            : "Open next consultation"
                        : "Open consultation demo"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="AI should reduce scanning time, not replace clinical judgment"
            tone="review"
            icon={<Stethoscope className="h-4 w-4 text-warning" />}
          >
            This queue surface keeps only the next patient, visit reason, and
            short summary visible. The physician remains responsible for final
            assessment and documentation.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">
                  Before opening the consultation
                </h3>
                <p className="text-sm text-muted">
                  Keep the physician workflow short and safe.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {physicianChecklist.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-[1.5rem] bg-white/75 px-4 py-4"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                  <p className="text-sm leading-6 text-muted">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
