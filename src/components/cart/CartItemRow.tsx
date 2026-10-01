"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/context/CartContext";
import { useStore } from "@/context/CartContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { formatUAH } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

export function CartItemRow({ item }: { item: CartItem }) {
  const { setQty, removeFromCart } = useStore();
  const { locale, dict } = useI18n();

  return (
    <div className="flex gap-4 border-b border-line py-5 last:border-0 dark:border-line-dark">
      <Link href={`/${item.category}/${item.slug}`} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24">
        <ProductVisual category={item.category} seed={item.id} className="h-full w-full" />
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            {item.brand && (
              <p className="text-xs font-medium uppercase text-muted dark:text-muted-dark">{item.brand}</p>
            )}
            <Link href={`/${item.category}/${item.slug}`} className="text-sm font-semibold hover:underline">
              {item.name[locale]}
            </Link>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            aria-label={dict.cart.remove}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-black/[0.05] hover:text-ember dark:text-muted-dark dark:hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-full border border-line dark:border-line-dark">
            <button
              aria-label={`${dict.product.quantity} −1`}
              onClick={() => setQty(item.id, item.qty - 1)}
              className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
            <button
              aria-label={`${dict.product.quantity} +1`}
              onClick={() => setQty(item.id, item.qty + 1)}
              className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm font-semibold">{formatUAH(item.price * item.qty)}</p>
        </div>
      </div>
    </div>
  );
}
