"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
}

const variantClasses: Record<NonNullable<SubmitButtonProps["variant"]>, string> = {
  primary: "bg-ink text-white hover:bg-ink/90",
  secondary: "border border-line bg-white text-ink hover:bg-canvas",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

/** Submit button that shows a pending state while its parent form's
 *  server action is in flight. Must be rendered inside a <form>. */
export function SubmitButton({ children, className, pendingText, variant = "primary" }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
    >
      {pending ? pendingText ?? "Збереження…" : children}
    </button>
  );
}
