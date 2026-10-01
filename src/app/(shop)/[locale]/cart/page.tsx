"use client";

import { ShoppingCart } from "lucide-react";
import { useStore } from "@/context/CartContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

export default function CartPage() {
  const { cart, cartTotal, cartCount, hydrated } = useStore();
  const { dict } = useI18n();

  if (hydrated && cart.length === 0) {
    return (
      <Container className="flex flex-col items-center justify-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
          <ShoppingCart className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 text-xl font-semibold">{dict.cart.emptyTitle}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted dark:text-muted-dark">{dict.cart.emptyText}</p>
        <Link href="/stations" className={buttonVariants({ className: "mt-6" })}>
          {dict.cart.goToCatalog}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.cart.title}</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl2 border border-line px-5 dark:border-line-dark">
          {cart.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div>
          <CartSummary subtotal={cartTotal} itemCount={cartCount} />
        </div>
      </div>
    </Container>
  );
}
