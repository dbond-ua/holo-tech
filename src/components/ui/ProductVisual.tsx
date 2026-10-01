"use client";

import {
  BatteryCharging,
  Zap,
  Sun,
  PlugZap,
  Home,
  Cable,
  type LucideIcon,
} from "lucide-react";
import type { CategorySlug } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryIcon: Record<CategorySlug, LucideIcon> = {
  stations: Zap,
  batteries: BatteryCharging,
  inverters: PlugZap,
  "solar-panels": Sun,
  kits: Home,
  accessories: Cable,
};

const categoryGradient: Record<CategorySlug, string> = {
  stations: "from-accent-500/25 via-accent-400/10 to-transparent",
  batteries: "from-volt/25 via-volt/10 to-transparent",
  inverters: "from-ember/20 via-ember/10 to-transparent",
  "solar-panels": "from-amber-400/25 via-amber-300/10 to-transparent",
  kits: "from-accent-500/20 via-volt/10 to-transparent",
  accessories: "from-muted/20 via-muted/5 to-transparent",
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function ProductVisual({
  category,
  seed,
  className,
  compact = false,
}: {
  category: CategorySlug;
  seed: string;
  className?: string;
  compact?: boolean;
}) {
  const Icon = categoryIcon[category];
  const n = hashSeed(seed);
  const rotate = (n % 7) - 3; // -3..3 deg
  const angle = 120 + (n % 90);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl2 bg-gradient-to-br",
        categoryGradient[category],
        "bg-[radial-gradient(120%_120%_at_20%_10%,var(--tw-gradient-stops))]",
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute h-[60%] w-[60%] rounded-full blur-3xl opacity-40"
        style={{
          background: `linear-gradient(${angle}deg, currentColor, transparent 70%)`,
        }}
      />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl border border-white/40 bg-white/40 shadow-lift backdrop-blur-sm transition-transform duration-500 ease-premium dark:border-white/10 dark:bg-white/5",
          compact ? "h-14 w-14" : "h-24 w-24 sm:h-28 sm:w-28"
        )}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <Icon
          className={cn("text-ink dark:text-ink-dark", compact ? "h-6 w-6" : "h-10 w-10 sm:h-12 sm:w-12")}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}
