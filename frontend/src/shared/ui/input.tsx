import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-[var(--color-ink)] outline-none transition placeholder:text-[#8aa1ac] focus:border-[rgba(12,122,107,0.34)] focus:ring-4 focus:ring-[rgba(12,122,107,0.12)]",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
