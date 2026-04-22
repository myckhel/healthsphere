import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_18px_50px_-38px_rgba(20,48,66,0.45)] backdrop-blur sm:p-7",
        className,
      )}
      {...props}
    />
  );
}
