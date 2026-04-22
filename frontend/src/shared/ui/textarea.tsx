import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-32 w-full rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition placeholder:text-[#8aa1ac] focus:border-[rgba(12,122,107,0.34)] focus:ring-4 focus:ring-[rgba(12,122,107,0.12)]",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
