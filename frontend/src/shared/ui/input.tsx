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
        "h-12 w-full rounded-field border border-line bg-white px-4 text-ink outline-none transition placeholder:text-muted/70 focus:border-brand/35 focus:ring-4 focus:ring-brand/12",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
