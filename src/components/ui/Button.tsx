import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Storefront buttons.
 *  - primary   Signal-orange fill, ink text. One per screen: Купити / Оформити.
 *  - secondary Ink fill. The companion action (У кошик) next to primary.
 *  - outline   Hairline border. Filters, utility actions.
 *  - ghost     No chrome until hover.
 *  - link      Text with an underline on hover — replaces secondary pill CTAs.
 *  - dark      Alias of secondary (kept for existing call sites).
 */
export type Variant = "primary" | "secondary" | "outline" | "ghost" | "link" | "dark";
export type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-signal text-signal-ink hover:bg-signal/90 active:bg-signal/80 disabled:bg-rule disabled:text-fg-3",
  secondary:
    "bg-fg text-paper hover:bg-fg/85 active:bg-fg/75 disabled:bg-rule disabled:text-fg-3",
  dark: "bg-fg text-paper hover:bg-fg/85 active:bg-fg/75 disabled:bg-rule disabled:text-fg-3",
  outline:
    "border border-rule bg-transparent text-fg hover:border-fg disabled:text-fg-3 disabled:hover:border-rule",
  ghost: "bg-transparent text-fg hover:bg-fg/[0.06] disabled:text-fg-3",
  link:
    "h-auto px-0 text-fg underline-offset-4 decoration-1 hover:underline disabled:text-fg-3",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-10 w-10 shrink-0",
  "icon-sm": "h-8 w-8 shrink-0",
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
    "inline-flex select-none items-center justify-center gap-2 rounded-md font-medium leading-none transition-[background-color,border-color,color,opacity] duration-150 ease-snap disabled:cursor-not-allowed",
    sizeClasses[size],
    variantClasses[variant],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
