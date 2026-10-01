"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { formatUAH } from "@/lib/utils";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

const FREE_SHIPPING_THRESHOLD = 20000;
const SHIPPING_COST = 150;
const PROMO_CODE = "HOLOTECH10";
const PROMO_PERCENT = 10;

export function CartSummary({ subtotal, itemCount }: { subtotal: number; itemCount: number }) {
  const { dict } = useI18n();
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const discount = appliedPromo ? Math.round(subtotal * (PROMO_PERCENT / 100)) : 0;
  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal - discount + shipping;

  function applyPromo() {
    if (promo.trim().toUpperCase() === PROMO_CODE) {
      setAppliedPromo(PROMO_CODE);
      setPromoError(null);
    } else {
      setPromoError(dict.cart.promoInvalid);
      setAppliedPromo(null);
    }
  }

  return (
    <div className="rounded-xl2 border border-line p-6 dark:border-line-dark">
      <h2 className="text-base font-semibold">{dict.cart.summaryTitle}</h2>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium" htmlFor="promo">
          {dict.cart.promoLabel}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              id="promo"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder={dict.cart.promoPlaceholder}
              className="w-full rounded-full border border-line bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:border-ink dark:border-line-dark"
            />
          </div>
          <button
            onClick={applyPromo}
            className="rounded-full border border-line px-4 text-sm font-medium transition-colors hover:bg-black/[0.03] dark:border-line-dark dark:hover:bg-white/[0.06]"
          >
            {dict.cart.apply}
          </button>
        </div>
        {promoError && <p className="mt-2 text-xs text-ember">{promoError}</p>}
        {appliedPromo && (
          <p className="mt-2 text-xs text-volt-600 dark:text-volt">{dict.cart.promoApplied(PROMO_PERCENT)}</p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5 text-sm dark:border-line-dark">
        <div className="flex justify-between text-muted dark:text-muted-dark">
          <span>{dict.cart.itemsLabel(itemCount)}</span>
          <span>{formatUAH(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-volt-600 dark:text-volt">
            <span>{dict.cart.discountLabel}</span>
            <span>-{formatUAH(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted dark:text-muted-dark">
          <span>{dict.cart.shippingLabel}</span>
          <span>{shipping === 0 ? dict.cart.freeShipping : formatUAH(shipping)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 dark:border-line-dark">
        <span className="text-base font-semibold">{dict.cart.totalLabel}</span>
        <span className="text-xl font-semibold tracking-tight">{formatUAH(total)}</span>
      </div>

      <Link
        href="/checkout"
        aria-disabled={itemCount === 0}
        className={buttonVariants({
          size: "lg",
          className: `mt-6 w-full ${itemCount === 0 ? "pointer-events-none opacity-40" : ""}`,
        })}
      >
        {dict.cart.checkoutCta}
      </Link>
    </div>
  );
}
