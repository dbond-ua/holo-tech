"use client";

import { useState } from "react";
import { useActionBar } from "@/components/ui/useActionBar";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import type { CategorySlug, Localized } from "@/lib/types";
import { useStore } from "@/context/CartContext";
import { useMiniCart } from "@/components/cart/MiniCart";
import { useI18n } from "@/i18n/I18nProvider";
import { localePath } from "@/i18n/localePath";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { cn, formatUAH } from "@/lib/utils";
import { isAvailableForOrder } from "@/lib/stock";

/**
 * Buy controls for the product / kit page: quantity, primary "Замовити"
 * (add + go to checkout), secondary "У кошик", wishlist. On mobile the same
 * actions are mirrored in a sticky bottom bar (price + Замовити) so buying
 * never needs a scroll back up. Cart behavior is unchanged.
 */
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
  image,
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
  image?: string;
}) {
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const { notifyAdded } = useMiniCart();
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const fav = isFavorite(id);
  // Kits (no productId-based stock tracking) simply pass no stockCount, so
  // isAvailableForOrder falls back to the manual inStock flag.
  const available = isAvailableForOrder({ inStock, stockCount, stockReserved });
  useActionBar();

  function handleAdd() {
    addToCart({ id, slug, category, name, brand, price }, qty);
    notifyAdded({ id, category, name, price, qty, image });
  }

  function handleBuyNow() {
    addToCart({ id, slug, category, name, brand, price }, qty);
    // Locale-prefixed push — a bare "/checkout" loses the current locale.
    router.push(localePath(locale, "/checkout"));
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" disabled={!available} onClick={handleBuyNow}>
            {available ? dict.product.order : dict.product.outOfStock}
          </Button>
          <button
            type="button"
            onClick={() => toggleFavorite(id)}
            aria-pressed={fav}
            aria-label={fav ? dict.product.removeFromFavorites : dict.product.addToFavorites}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-rule transition-colors hover:border-fg"
          >
            <Heart className={cn("h-5 w-5", fav && "fill-signal text-signal")} strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex gap-2">
          <Stepper value={qty} onChange={setQty} size="lg" label={dict.product.quantity} />
          <Button size="lg" variant="secondary" className="flex-1" disabled={!available} onClick={handleAdd}>
            {dict.product.addToCart}
          </Button>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-fg-2">{name[locale]}</p>
            <p className="num text-lg font-semibold leading-tight">{formatUAH(price)}</p>
          </div>
          <Button size="md" variant="secondary" disabled={!available} onClick={handleAdd} className="h-11">
            {dict.product.addToCart}
          </Button>
          <Button size="md" disabled={!available} onClick={handleBuyNow} className="h-11">
            {available ? dict.product.order : dict.product.outOfStock}
          </Button>
        </div>
      </div>
    </>
  );
}
