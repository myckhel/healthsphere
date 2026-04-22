import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-panel border border-line bg-panel p-6 shadow-panel backdrop-blur sm:p-7",
        className,
      )}
      {...props}
    />
  );
}
