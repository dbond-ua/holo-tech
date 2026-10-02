import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Rectangular mono label. Storefront rule: at most one badge per product
 * card — see `primaryBadge()` in ProductCard.
 *
 * Legacy tone names (accent / volt / ember) are kept so older call sites
 * keep compiling; they map onto the new palette.
 */
type Tone = "neutral" | "signal" | "quiet" | "outline" | "accent" | "volt" | "ember";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-fg text-paper",
  signal: "bg-signal text-signal-ink",
  quiet: "bg-stage text-fg-2",
  outline: "border border-rule text-fg-2",
  accent: "bg-fg text-paper",
  volt: "bg-stage text-fg",
  ember: "bg-signal text-signal-ink",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "caption inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm px-2 leading-none",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
