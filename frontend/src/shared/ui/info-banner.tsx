import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type InfoBannerProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  tone?: "info" | "review" | "success";
  icon?: ReactNode;
};

const toneClasses: Record<NonNullable<InfoBannerProps["tone"]>, string> = {
  info: "border-info/12 bg-info-soft/80 text-info",
  review: "border-warning/18 bg-warning-soft/80 text-warning",
  success: "border-success/15 bg-success-soft/85 text-success",
};

export function InfoBanner({
  className,
  title,
  tone = "info",
  icon,
  children,
  ...props
}: InfoBannerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-[1.5rem] border px-4 py-4",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
          {icon}
        </div>
      ) : null}

      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {children ? (
          <div className="text-sm leading-6 text-ink/80">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
