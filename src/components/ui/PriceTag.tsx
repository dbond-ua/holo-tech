import { formatUAH, discountPercent, cn } from "@/lib/utils";

/**
 * Price is the loudest element on a card and on the product page:
 * always `fg`, tabular figures, heavier than the product name.
 * Old price sits next to it in fg-2, the discount is plain text in
 * signal-text — no pill.
 */
const sizeClasses = {
  sm: "text-base",
  md: "text-[19px] sm:text-[22px]",
  lg: "text-[34px] sm:text-[44px]",
} as const;

export function PriceTag({
  price,
  oldPrice,
  size = "md",
  className,
  showDiscount = true,
}: {
  price: number;
  oldPrice?: number;
  size?: keyof typeof sizeClasses;
  className?: string;
  showDiscount?: boolean;
}) {
  const discount = discountPercent(price, oldPrice);
  const hasOld = Boolean(oldPrice && oldPrice > price);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5", className)}>
      <span
        className={cn(
          "num whitespace-nowrap font-semibold leading-none tracking-[-0.02em] text-fg",
          sizeClasses[size]
        )}
      >
        {formatUAH(price)}
      </span>
      {hasOld && (
        <span
          className={cn(
            "num whitespace-nowrap text-fg-2 line-through decoration-1",
            size === "lg" ? "text-base" : "text-[13px]"
          )}
        >
          {formatUAH(oldPrice!)}
        </span>
      )}
      {showDiscount && discount && (
        <span
          className={cn(
            "num whitespace-nowrap font-medium text-signal-text",
            size === "lg" ? "text-base" : "text-[13px]"
          )}
        >
          −{discount}%
        </span>
      )}
    </div>
  );
}
