"use client";

import { useStore } from "@/context/CartContext";
import { allProducts } from "@/lib/data";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { useI18n } from "@/i18n/I18nProvider";

export function FavoritesClient() {
  const { favorites, hydrated } = useStore();
  const { dict } = useI18n();
  const items = allProducts.filter((p) => favorites.includes(p.id));

  if (!hydrated) return <div className="skeleton h-64" />;

  return items.length === 0 ? (
    <EmptyState title={dict.favorites.emptyTitle} text={dict.favorites.emptyText} lead={dict.ui.emptyFavoritesLead} />
  ) : (
    <ProductGrid products={items} columns="wide" />
  );
}
