import { formatUAH, discountPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  oldPrice,
  size = "md",
  className,
}: {
  price: number;
  oldPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const discount = discountPercent(price, oldPrice);
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  } as const;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold tracking-tight", sizeClasses[size])}>{formatUAH(price)}</span>
      {oldPrice && oldPrice > price && (
        <span className="text-sm text-muted dark:text-muted-dark line-through">{formatUAH(oldPrice)}</span>
      )}
      {discount && (
        <span className="rounded-full bg-ember/10 px-2 py-0.5 text-xs font-semibold text-ember">
          -{discount}%
        </span>
      )}
    </div>
  );
}
