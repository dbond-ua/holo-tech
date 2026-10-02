"use client";

import { useStore } from "@/context/CartContext";
import { Container } from "@/components/ui/Container";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { useI18n } from "@/i18n/I18nProvider";

export default function CartPage() {
  const { cart, cartTotal, cartCount, hydrated } = useStore();
  const { dict } = useI18n();

  return (
    <Container className="pt-6 sm:pt-10">
      <div className="mb-6 flex items-baseline gap-4 sm:mb-10">
        <h1 className="text-[34px] font-semibold leading-none tracking-[-0.03em] sm:text-h1">{dict.cart.title}</h1>
        {hydrated && cartCount > 0 && <span className="spec text-fg-2">{dict.ui.productsCount(cartCount)}</span>}
      </div>

      {!hydrated ? (
        <div className="skeleton h-64" />
      ) : cart.length === 0 ? (
        <EmptyState title={dict.cart.emptyTitle} text={dict.cart.emptyText} lead={dict.ui.emptyCartLead} />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <ul className="border-t border-fg lg:col-span-8">
            {cart.map((item) => (
              <li key={item.id}>
                <CartItemRow item={item} />
              </li>
            ))}
          </ul>
          <div className="lg:col-span-4">
            <CartSummary subtotal={cartTotal} itemCount={cartCount} />
          </div>
        </div>
      )}
    </Container>
  );
}
