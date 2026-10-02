"use client";

import { useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import type { BaseProduct } from "@/lib/types";
import { ProductImage } from "@/components/ui/ProductVisual";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { Badge } from "@/components/ui/Badge";
import { Availability } from "@/components/ui/Availability";
import { useStore } from "@/context/CartContext";
import { useMiniCart } from "@/components/cart/MiniCart";
import { useI18n } from "@/i18n/I18nProvider";
import { getAvailability, getPrimaryBadge, getSpecLine, productHref } from "@/lib/product-ui";
import { cn } from "@/lib/utils";

export type ProductCardVariant = "grid" | "feature" | "list";

/**
 * Product card in three layouts:
 *  - grid    the default catalog cell (the grid draws the hairlines)
 *  - feature a large editorial cell for the homepage showcase
 *  - list    a full-width row with the complete spec line, for comparing
 *
 * Content order is the same everywhere: photo on stage → brand + stock →
 * name → key specs → price + quick add. One badge max, rating only when
 * there are reviews, wishlist on hover (always visible on touch / when set).
 */
export function ProductCard({
  product,
  variant = "grid",
  className,
  priority = false,
}: {
  product: BaseProduct;
  variant?: ProductCardVariant;
  className?: string;
  priority?: boolean;
}) {
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const { notifyAdded } = useMiniCart();
  const { locale, dict } = useI18n();
  const [justAdded, setJustAdded] = useState(false);

  const fav = isFavorite(product.id);
  const name = product.name[locale];
  const href = productHref(product);
  const availability = getAvailability(product, dict);
  const canBuy = availability.kind !== "out";
  const badge = getPrimaryBadge(product, dict);
  const specs = getSpecLine(product, dict, variant === "list" ? 4 : 3);
  const images = product.imageUrls ?? [];

  function handleAdd() {
    if (!canBuy) return;
    addToCart({
      id: product.id,
      slug: product.slug,
      category: product.category,
      name: product.name,
      brand: product.brand,
      price: product.price,
    });
    notifyAdded({
      id: product.id,
      category: product.category,
      name: product.name,
      price: product.price,
      qty: 1,
      image: images[0],
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  const favButton = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleFavorite(product.id);
      }}
      aria-label={fav ? dict.product.removeFromFavorites : dict.product.addToFavorites}
      aria-pressed={fav}
      className={cn(
        "absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-md text-fg transition-opacity duration-150 hover:bg-paper/70 focus-visible:opacity-100",
        fav ? "opacity-100" : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
      )}
    >
      <Heart className={cn("h-[18px] w-[18px]", fav && "fill-signal text-signal")} strokeWidth={1.5} />
    </button>
  );

  const addButton = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!canBuy}
      aria-label={canBuy ? `${dict.product.addToCart}: ${name}` : dict.product.outOfStock}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md transition-colors duration-150",
        variant === "feature" ? "h-11 w-11" : "h-9 w-9 sm:h-10 sm:w-10",
        !canBuy
          ? "cursor-not-allowed border border-rule text-fg-3"
          : justAdded
          ? "bg-ok text-paper"
          : "bg-fg text-paper hover:bg-signal hover:text-signal-ink"
      )}
    >
      {justAdded ? (
        <Check className="h-4 w-4" strokeWidth={2} />
      ) : (
        <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.5} />
      )}
    </button>
  );

  const image = (
    <Link
      href={href}
      tabIndex={-1}
      aria-hidden="true"
      className={cn(
        "relative block overflow-hidden",
        variant === "list"
          ? "aspect-square w-28 shrink-0 sm:w-36"
          : variant === "feature"
          ? "aspect-[4/3] lg:aspect-auto lg:min-h-[360px] lg:flex-1"
          : "aspect-square"
      )}
    >
      <ProductImage
        src={images[0]}
        alt={name}
        category={product.category}
        priority={priority}
        compact={variant === "list"}
        className={cn("absolute inset-0 transition-opacity duration-300", !canBuy && "opacity-60")}
      />
      {images[1] && (
        <ProductImage
          src={images[1]}
          alt=""
          category={product.category}
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      {badge && variant !== "list" && (
        <Badge tone={badge.tone} className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
          {badge.label}
        </Badge>
      )}
    </Link>
  );

  if (variant === "list") {
    return (
      <article className={cn("group relative flex gap-4 bg-paper p-3 sm:gap-6 sm:p-4", className)}>
        {image}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="caption text-fg-2">{product.brand}</p>
            <Link href={href} className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug hover:underline sm:text-base">
              {name}
            </Link>
            {specs.length > 0 && <p className="spec mt-1.5 text-fg-2">{specs.join(" · ")}</p>}
            {product.reviewsCount > 0 && (
              <RatingStars compact rating={product.rating} count={product.reviewsCount} className="mt-2" />
            )}
          </div>
          <div className="flex items-end justify-between gap-4 sm:w-56 sm:flex-col sm:items-end sm:justify-center">
            <div className="sm:text-right">
              <PriceTag price={product.price} oldPrice={product.oldPrice} className="sm:justify-end" />
              <Availability value={availability} className="mt-2" />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={fav ? dict.product.removeFromFavorites : dict.product.addToFavorites}
                aria-pressed={fav}
                className="flex h-10 w-10 items-center justify-center rounded-md text-fg-2 hover:text-fg"
              >
                <Heart className={cn("h-[18px] w-[18px]", fav && "fill-signal text-signal")} strokeWidth={1.5} />
              </button>
              {addButton}
            </div>
          </div>
        </div>
      </article>
    );
  }

  const isFeature = variant === "feature";

  return (
    <article className={cn("group relative flex flex-col bg-paper", className)}>
      {image}
      {favButton}
      <div className={cn("flex flex-col", isFeature ? "p-5 sm:p-7" : "flex-1 p-3 sm:p-4")}>
        <div className="flex items-center justify-between gap-2">
          <p className="caption truncate text-fg-2">{product.brand}</p>
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full sm:hidden",
              availability.kind === "in_stock" ? "bg-ok" : availability.kind === "out" ? "bg-fg-3" : "bg-warn"
            )}
            aria-hidden="true"
          />
          <Availability value={availability} className="hidden sm:inline-flex" />
        </div>

        <Link
          href={href}
          className={cn(
            "mt-1.5 line-clamp-2 font-medium leading-snug decoration-1 underline-offset-2 hover:underline",
            isFeature ? "text-xl sm:text-h3" : "text-sm sm:text-[15px]"
          )}
        >
          {name}
        </Link>

        {specs.length > 0 && (
          <p className={cn("spec mt-1.5 text-fg-2", isFeature ? "" : "line-clamp-1 text-[12px] sm:text-spec")}>
            {specs.map((v, i) => (
              <span key={v} className={cn(i >= 2 && !isFeature && "hidden sm:inline")}>
                {i > 0 && " · "}
                {v}
              </span>
            ))}
          </p>
        )}

        {product.reviewsCount > 0 && (
          <RatingStars compact rating={product.rating} count={product.reviewsCount} className="mt-2" />
        )}

        <div className={cn("mt-auto flex items-end justify-between gap-2", isFeature ? "pt-6" : "pt-4")}>
          <PriceTag
            price={product.price}
            oldPrice={product.oldPrice}
            size={isFeature ? "lg" : "md"}
            showDiscount={false}
            className={cn("min-w-0", !isFeature && "flex-col items-start gap-y-1 sm:flex-row sm:items-baseline")}
          />
          {addButton}
        </div>
      </div>
    </article>
  );
}
