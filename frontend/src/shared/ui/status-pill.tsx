import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const statusPillVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--color-border)] bg-white/90 text-[var(--color-ink)]",
        info: "border-transparent bg-[#dff2f7] text-[var(--color-info)]",
        review: "border-transparent bg-[#fff0db] text-[var(--color-review)]",
        success:
          "border-transparent bg-[#e2f6ef] text-[var(--color-brand-strong)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type StatusPillProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusPillVariants>;

export function StatusPill({ className, tone, ...props }: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...props} />
  );
}
