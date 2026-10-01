import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 14,
  showValue = false,
  count,
  className,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "fill-ink text-ink dark:fill-ink-dark dark:text-ink-dark" : "text-line dark:text-line-dark"}
            />
          );
        })}
      </div>
      <span className="sr-only">{`Рейтинг ${rating} из 5`}</span>
      {showValue && <span className="text-sm font-medium">{rating.toFixed(1)}</span>}
      {typeof count === "number" && (
        <span className="text-sm text-muted dark:text-muted-dark">({count})</span>
      )}
    </div>
  );
}
