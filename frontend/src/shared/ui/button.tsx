import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(12,122,107,0.35)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-brand)] px-4 py-2.5 text-white shadow-[0_18px_30px_-20px_rgba(12,122,107,0.95)] hover:bg-[var(--color-brand-strong)]",
        secondary:
          "border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--color-ink)] hover:border-[rgba(12,122,107,0.28)] hover:bg-[#f9fcfb]",
        ghost:
          "border-transparent bg-transparent px-4 py-2.5 text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-ink)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
