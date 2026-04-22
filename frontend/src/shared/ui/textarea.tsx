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
        "min-h-32 w-full rounded-[1.5rem] border border-line bg-white px-4 py-3 text-ink outline-none transition placeholder:text-muted/70 focus:border-brand/35 focus:ring-4 focus:ring-brand/12",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
