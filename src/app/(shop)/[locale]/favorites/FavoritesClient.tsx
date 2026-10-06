"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/context/CartContext";
import type { BaseProduct } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Favorite ids live in the visitor's browser; the products themselves are
 * fetched from the catalog API (the full catalog is not shipped to the page).
 * Un-favoriting on this page hides the card immediately without a refetch.
 */
export function FavoritesClient() {
  const { favorites, hydrated } = useStore();
  const { dict } = useI18n();
  const [loaded, setLoaded] = useState<BaseProduct[] | null>(null);
  const idsKey = favorites.join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (favorites.length === 0) {
      setLoaded([]);
      return;
    }
    // Only fetch when a favorite we don't have yet appears.
    if (loaded && favorites.every((id) => loaded.some((p) => p.id === id))) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(idsKey)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data: { products: BaseProduct[] }) => setLoaded(data.products))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded([]);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, idsKey]);

  if (!hydrated || loaded === null) return <div className="skeleton h-64" />;

  const items = loaded.filter((p) => favorites.includes(p.id));
  return items.length === 0 ? (
    <EmptyState title={dict.favorites.emptyTitle} text={dict.favorites.emptyText} lead={dict.ui.emptyFavoritesLead} />
  ) : (
    <ProductGrid products={items} columns="wide" />
  );
}
