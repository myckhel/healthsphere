import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const statusPillVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      tone: {
        neutral: "border-line bg-white/90 text-ink",
        info: "border-transparent bg-info-soft text-info",
        review: "border-transparent bg-warning-soft text-warning",
        success: "border-transparent bg-success-soft text-success",
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
