"use client";

import { useState } from "react";
import { formatUAH } from "@/lib/utils";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { buttonVariants } from "@/components/ui/Button";
import { useActionBar } from "@/components/ui/useActionBar";
import { useI18n } from "@/i18n/I18nProvider";

const PROMO_CODE = "HOLOTECH10";
const PROMO_PERCENT = 10;

/**
 * Order summary.
 *
 * Shipping: the order API stores total = subtotal (no shipping fee is ever
 * charged by the store), so the summary no longer adds a flat 150 ₴ — it
 * states that Nova Poshta delivery is billed at carrier rates. This removes
 * the mismatch between the cart total and the checkout / order total.
 *
 * Promo code: behavior unchanged, the field is just collapsed behind a link.
 */
export function CartSummary({ subtotal, itemCount }: { subtotal: number; itemCount: number }) {
  const { dict } = useI18n();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  useActionBar();

  const discount = appliedPromo ? Math.round(subtotal * (PROMO_PERCENT / 100)) : 0;
  const total = subtotal - discount;

  function applyPromo() {
    if (promo.trim().toUpperCase() === PROMO_CODE) {
      setAppliedPromo(PROMO_CODE);
      setPromoError(null);
    } else {
      setPromoError(dict.cart.promoInvalid);
      setAppliedPromo(null);
    }
  }

  const checkoutLink = (
    <Link
      href="/checkout"
      aria-disabled={itemCount === 0}
      className={buttonVariants({
        size: "lg",
        className: `w-full ${itemCount === 0 ? "pointer-events-none opacity-40" : ""}`,
      })}
    >
      {dict.cart.checkoutCta}
    </Link>
  );

  return (
    <>
      <div className="border-t border-fg lg:sticky lg:top-[8.5rem]">
        <h2 className="py-4 text-base font-semibold">{dict.cart.summaryTitle}</h2>

        <dl className="border-t border-rule text-[15px]">
          <div className="flex justify-between border-b border-rule py-3">
            <dt className="text-fg-2">{dict.cart.itemsLabel(itemCount)}</dt>
            <dd className="num">{formatUAH(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between border-b border-rule py-3 text-signal-text">
              <dt>{dict.cart.discountLabel}</dt>
              <dd className="num">−{formatUAH(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-b border-rule py-3">
            <dt className="text-fg-2">{dict.cart.shippingLabel}</dt>
            <dd className="text-right">{dict.ui.shippingCarrier}</dd>
          </div>
          <div className="flex items-baseline justify-between py-4">
            <dt className="font-semibold">{dict.cart.totalLabel}</dt>
            <dd className="num text-[28px] font-semibold tracking-[-0.02em]">{formatUAH(total)}</dd>
          </div>
        </dl>

        <div className="hidden lg:block">{checkoutLink}</div>
        <p className="mt-3 text-[13px] text-fg-2">{dict.ui.shippingNote}</p>

        <div className="mt-6 border-t border-rule pt-4">
          {!promoOpen && !appliedPromo ? (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              {dict.ui.havePromo}
            </button>
          ) : (
            <div>
              <label className="caption mb-2 block text-fg-2" htmlFor="promo">
                {dict.cart.promoLabel}
              </label>
              <div className="flex gap-2">
                <input
                  id="promo"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  autoComplete="off"
                  className="h-10 min-w-0 flex-1 rounded-sm border border-rule bg-panel px-3 text-sm uppercase outline-none transition-colors focus:border-fg"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className={buttonVariants({ variant: "outline", size: "md" })}
                >
                  {dict.cart.apply}
                </button>
              </div>
              {promoError && <p className="mt-2 text-[13px] text-signal-text">{promoError}</p>}
              {appliedPromo && <p className="mt-2 text-[13px] text-ok">{dict.cart.promoApplied(PROMO_PERCENT)}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[13px] text-fg-2">{dict.cart.totalLabel}</p>
            <p className="num text-lg font-semibold leading-tight">{formatUAH(total)}</p>
          </div>
          <div className="flex-1">{checkoutLink}</div>
        </div>
      </div>
    </>
  );
}
