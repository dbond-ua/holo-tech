"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Heart, ShoppingCart } from "lucide-react";
import type { CategorySlug, Localized } from "@/lib/types";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { localePath } from "@/i18n/localePath";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isAvailableForOrder } from "@/lib/stock";

export function ProductActions({
  id,
  slug,
  category,
  name,
  brand,
  price,
  inStock = true,
  stockCount,
  stockReserved,
}: {
  id: string;
  slug: string;
  category: CategorySlug;
  name: Localized;
  brand?: string;
  price: number;
  inStock?: boolean;
  stockCount?: number | null;
  stockReserved?: number | null;
}) {
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const fav = isFavorite(id);
  // Kits (no productId-based stock tracking) simply pass no stockCount, so
  // isAvailableForOrder falls back to the manual inStock flag — unchanged
  // behavior for them.
  const available = isAvailableForOrder({ inStock, stockCount, stockReserved });

  function handleAdd() {
    addToCart({ id, slug, category, name, brand, price }, qty);
  }

  function handleBuyNow() {
    handleAdd();
    // Locale-prefixed push — a bare "/checkout" loses the current locale
    // (the middleware redirects an unprefixed path to the *default* locale,
    // silently bouncing an EN visitor into the UK checkout page).
    router.push(localePath(locale, "/checkout"));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-line dark:border-line-dark">
          <button
            aria-label="-"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium">{qty}</span>
          <button
            aria-label="+"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => toggleFavorite(id)}
          aria-pressed={fav}
          aria-label={fav ? dict.header.favorites : dict.product.addToFavorites}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:bg-black/[0.04] dark:border-line-dark dark:hover:bg-white/[0.06]"
        >
          <Heart className={cn("h-[18px] w-[18px]", fav && "fill-ember text-ember")} />
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" disabled={!available} onClick={handleBuyNow}>
          {available ? dict.product.order : dict.product.outOfStock}
        </Button>
        <Button size="lg" variant="outline" className="flex-1" disabled={!available} onClick={handleAdd}>
          <ShoppingCart className="h-4 w-4" /> {dict.product.addToCart}
        </Button>
      </div>
    </div>
  );
}
