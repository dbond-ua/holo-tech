"use client";

import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Heart, ShoppingCart, Zap, BatteryFull, Plug, Check } from "lucide-react";
import type { BaseProduct } from "@/lib/types";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { isAvailableForOrder } from "@/lib/stock";

export function ProductCard({ product, className }: { product: BaseProduct; className?: string }) {
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const { locale, dict } = useI18n();
  const [justAdded, setJustAdded] = useState(false);
  const fav = isFavorite(product.id);
  const name = product.name[locale];
  const available = isAvailableForOrder({
    inStock: product.inStock,
    stockCount: product.stockCount,
    stockReserved: product.stockReserved,
  });

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift dark:border-line-dark dark:bg-surface-dark",
        className
      )}
    >
      <Link href={`/${product.category}/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {product.isNew && <Badge tone="accent">{dict.common.new}</Badge>}
          {product.isBestseller && <Badge tone="volt">{dict.common.bestseller}</Badge>}
          {product.oldPrice && <Badge tone="ember">{dict.common.sale}</Badge>}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
          aria-label={fav ? dict.header.favorites : dict.product.addToFavorites}
          aria-pressed={fav}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
        >
          <Heart className={cn("h-4 w-4 transition-colors", fav && "fill-ember text-ember")} />
        </button>
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full p-4 transition-transform duration-500 ease-premium group-hover:scale-[1.04]">
            <ProductVisual category={product.category} seed={product.id} className="h-full w-full" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted dark:text-muted-dark">
            {product.brand}
          </span>
          <RatingStars rating={product.rating} count={product.reviewsCount} size={12} />
        </div>

        <Link href={`/${product.category}/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug">
          {name}
        </Link>

        {(product.powerW || product.capacityWh || product.outlets) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted dark:text-muted-dark">
            {product.powerW && (
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" /> {product.powerW} {dict.units.w}
              </span>
            )}
            {product.capacityWh && (
              <span className="inline-flex items-center gap-1">
                <BatteryFull className="h-3.5 w-3.5" /> {product.capacityWh} {dict.units.wh}
              </span>
            )}
            {product.outlets && (
              <span className="inline-flex items-center gap-1">
                <Plug className="h-3.5 w-3.5" /> {product.outlets} {dict.units.outlets}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <PriceTag price={product.price} oldPrice={product.oldPrice} size="sm" />
            <p className={cn("mt-1 text-xs", available ? "text-volt-600 dark:text-volt" : "text-ember")}>
              {!available ? dict.product.outOfStock : product.inStock ? dict.common.inStock : dict.common.onOrder}
            </p>
          </div>
          <button
            onClick={() => {
              if (!available) return;
              addToCart({
                id: product.id,
                slug: product.slug,
                category: product.category,
                name: product.name,
                brand: product.brand,
                price: product.price,
              });
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1500);
            }}
            disabled={!available}
            aria-label={dict.product.addToCart}
            aria-disabled={!available}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
              !available
                ? "cursor-not-allowed bg-line text-muted dark:bg-line-dark dark:text-muted-dark"
                : justAdded
                  ? "bg-volt-600 text-ink"
                  : "bg-ink text-white hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/90"
            )}
          >
            {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
