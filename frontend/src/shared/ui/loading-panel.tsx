import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";
import { StepProgress } from "@/shared/ui/step-progress";

type LoadingPanelProps = {
  title: string;
  description: string;
  label?: string;
  icon?: ReactNode;
  steps?: readonly string[];
  currentStep?: number;
  className?: string;
};

export function LoadingPanel({
  title,
  description,
  label = "Syncing",
  icon,
  steps,
  currentStep = 0,
  className,
}: LoadingPanelProps) {
  return (
    <Card className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            {icon ?? <LoaderCircle className="h-5 w-5 animate-spin" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              In progress
            </p>
            <h3 className="mt-2 text-2xl text-ink">{title}</h3>
          </div>
        </div>

        <StatusPill tone="info">{label}</StatusPill>
      </div>

      <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>

      {steps?.length ? (
        <div className="rounded-[1.5rem] border border-line bg-white/80 px-4 py-4">
          <StepProgress steps={steps} currentStep={currentStep} />
        </div>
      ) : null}
    </Card>
  );
}
