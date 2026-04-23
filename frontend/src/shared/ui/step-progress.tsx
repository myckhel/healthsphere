import { cn } from "@/shared/lib/cn";

type StepProgressProps = {
  steps: readonly string[];
  currentStep: number;
};

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <ol className="flex flex-wrap gap-3" aria-label="Progress">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <li
            key={step}
            className="flex min-w-[8rem] flex-1 items-center gap-3"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                isComplete && "border-brand bg-brand text-white",
                isActive && "border-brand bg-brand-soft text-brand-strong",
                !isActive && !isComplete && "border-line bg-white text-muted",
              )}
            >
              {index + 1}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Step {index + 1}
              </p>
              <p className="text-sm font-medium text-ink">{step}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
