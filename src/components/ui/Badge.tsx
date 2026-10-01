import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "volt" | "ember" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-black/[0.05] text-ink dark:bg-white/10 dark:text-ink-dark",
  accent: "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400",
  volt: "bg-volt/20 text-volt-600 dark:bg-volt/15 dark:text-volt",
  ember: "bg-ember/10 text-ember",
  outline: "border border-line dark:border-line-dark text-muted dark:text-muted-dark",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
