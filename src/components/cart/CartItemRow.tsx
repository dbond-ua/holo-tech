"use client";

import type { CartItem } from "@/context/CartContext";
import { useStore } from "@/context/CartContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Stepper } from "@/components/ui/Stepper";
import { formatUAH } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

export function CartItemRow({ item }: { item: CartItem }) {
  const { setQty, removeFromCart } = useStore();
  const { locale, dict } = useI18n();
  const href = `/${item.category}/${item.slug}`;

  return (
    <div className="flex gap-4 border-b border-rule py-5 sm:gap-6">
      <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <ProductVisual category={item.category} compact className="h-24 w-24 sm:h-28 sm:w-32" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
        <div className="min-w-0 flex-1">
          {item.brand && <p className="caption text-fg-2">{item.brand}</p>}
          <Link href={href} className="mt-1 block text-[15px] font-medium leading-snug hover:underline sm:text-base">
            {item.name[locale]}
          </Link>
          <p className="num mt-1 text-[13px] text-fg-2">
            {formatUAH(item.price)} / {dict.ui.pieces}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
          <p className="num whitespace-nowrap text-lg font-semibold sm:order-2">{formatUAH(item.price * item.qty)}</p>
          <div className="flex items-center gap-3 sm:order-1">
            <button
              type="button"
              onClick={() => removeFromCart(item.id)}
              className="text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline"
            >
              {dict.cart.remove}
            </button>
            <Stepper
              value={item.qty}
              min={0}
              onChange={(n) => setQty(item.id, n)}
              size="sm"
              label={dict.product.quantity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
