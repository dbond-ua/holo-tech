"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Square quantity stepper with a hairline frame. */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "Кількість",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const box = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-11" : "h-10 w-10";
  const btn =
    "flex items-center justify-center text-fg-2 transition-colors hover:text-fg disabled:text-fg-3 disabled:hover:text-fg-3";

  return (
    <div
      className={cn("inline-flex items-center rounded-md border border-rule", className)}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`${label} −1`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(btn, box)}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <span className="num min-w-[2ch] text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`${label} +1`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(btn, box)}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
