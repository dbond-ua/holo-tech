"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { CategorySlug, Localized } from "@/lib/types";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ProductImage } from "@/components/ui/ProductVisual";
import { buttonVariants } from "@/components/ui/Button";
import { formatUAH } from "@/lib/utils";

/**
 * Post-add confirmation. Purely presentational — it reads the cart from
 * CartContext and never changes it. Product cards and the product page call
 * `notifyAdded()` right after `addToCart()`.
 */
interface AddedItem {
  id: string;
  category: CategorySlug;
  name: Localized;
  price: number;
  qty: number;
  image?: string;
}

const MiniCartContext = createContext<{ notifyAdded: (item: AddedItem) => void }>({
  notifyAdded: () => undefined,
});

export function useMiniCart() {
  return useContext(MiniCartContext);
}

export function MiniCartProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<AddedItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { cartCount, cartTotal } = useStore();
  const { dict, locale } = useI18n();

  useEffect(() => setMounted(true), []);
  useEffect(() => setItem(null), [pathname]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setItem(null);
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => setItem(null), 6000);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [item]);

  const notifyAdded = useCallback((next: AddedItem) => setItem(next), []);

  return (
    <MiniCartContext.Provider value={{ notifyAdded }}>
      {children}
      {mounted &&
        item &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="anim-drop fixed inset-x-2 top-2 z-[120] border border-rule bg-paper shadow-overlay sm:inset-x-auto sm:right-6 sm:top-[7.5rem] sm:w-[380px] lg:top-[7.25rem]"
          >
            <div className="flex items-center justify-between border-b border-rule py-2.5 pl-4 pr-1.5">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Check className="h-4 w-4 text-ok" strokeWidth={2} />
                {dict.ui.addedToCart}
              </p>
              <button
                type="button"
                onClick={() => setItem(null)}
                aria-label={dict.common.close}
                className="flex h-8 w-8 items-center justify-center rounded-md text-fg-2 hover:text-fg"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex gap-3 p-4">
              <ProductImage src={item.image} alt="" category={item.category} compact className="h-16 w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name[locale]}</p>
                <p className="num mt-1 text-sm text-fg-2">
                  {item.qty} × {formatUAH(item.price)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-rule px-4 py-3 text-sm">
              <span className="text-fg-2">{dict.cart.itemsLabel(cartCount)}</span>
              <span className="num font-semibold">{formatUAH(cartTotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              <button
                type="button"
                onClick={() => setItem(null)}
                className={buttonVariants({ variant: "outline", size: "md" })}
              >
                {dict.ui.continueShopping}
              </button>
              <Link href="/cart" className={buttonVariants({ variant: "primary", size: "md" })}>
                {dict.ui.goToCart}
              </Link>
            </div>
          </div>,
          document.body
        )}
    </MiniCartContext.Provider>
  );
}
