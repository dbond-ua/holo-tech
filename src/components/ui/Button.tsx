import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type Variant = "primary" | "secondary" | "outline" | "ghost" | "dark";
export type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-600 active:bg-accent-700 shadow-soft",
  secondary:
    "bg-ink text-white hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/90",
  outline:
    "border border-line dark:border-line-dark bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
  ghost: "bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
  dark: "bg-ink text-white hover:bg-black shadow-soft",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-full",
  md: "h-11 px-6 text-sm rounded-full",
  lg: "h-14 px-8 text-base rounded-full",
  icon: "h-11 w-11 rounded-full shrink-0",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-premium disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
