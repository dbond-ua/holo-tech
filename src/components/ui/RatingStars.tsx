import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Rating display.
 *  - default: five stars (+ optional value / count) — product page, reviews.
 *  - compact: "★ 4.8 · 12" — product cards.
 * Call sites should not render a rating at all when there are no reviews
 * (a row of empty stars and "(0)" reads as a negative signal).
 */
export function RatingStars({
  rating,
  size = 14,
  showValue = false,
  count,
  compact = false,
  className,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
  compact?: boolean;
  className?: string;
}) {
  const label = `${rating.toFixed(1)} / 5`;

  if (compact) {
    return (
      <span className={cn("num inline-flex items-center gap-1 text-[13px] text-fg-2", className)}>
        <Star className="h-3 w-3 fill-fg text-fg" aria-hidden="true" />
        <span className="text-fg">{rating.toFixed(1)}</span>
        {typeof count === "number" && <span>· {count}</span>}
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-px" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              strokeWidth={1.5}
              className={filled ? "fill-fg text-fg" : "text-fg/25"}
            />
          );
        })}
      </div>
      <span className="sr-only">{label}</span>
      {showValue && <span className="num text-sm font-medium">{rating.toFixed(1)}</span>}
      {typeof count === "number" && <span className="num text-sm text-fg-2">({count})</span>}
    </div>
  );
}
