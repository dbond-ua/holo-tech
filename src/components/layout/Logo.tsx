import { cn } from "@/lib/utils";

/**
 * HoloTech wordmark: the name set tight in the UI face, followed by a small
 * charge-level mark — four bars, the last one in signal orange. Pure SVG +
 * text, no external asset.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-fg", className)}>
      <span className={cn("font-semibold leading-none tracking-[-0.04em]", compact ? "text-[19px]" : "text-[21px]")}>
        HoloTech
      </span>
      <svg viewBox="0 0 22 12" className="h-[11px] w-auto" aria-hidden="true">
        <rect x="0" y="0" width="4" height="12" fill="currentColor" />
        <rect x="6" y="0" width="4" height="12" fill="currentColor" />
        <rect x="12" y="0" width="4" height="12" fill="currentColor" />
        <rect x="18" y="0" width="4" height="12" className="fill-signal" />
      </svg>
    </span>
  );
}
