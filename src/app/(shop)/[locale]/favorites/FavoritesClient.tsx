"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/context/CartContext";
import { allProducts } from "@/lib/data";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

export function FavoritesClient() {
  const { favorites, hydrated } = useStore();
  const { dict } = useI18n();
  const items = allProducts.filter((p) => favorites.includes(p.id));

  return (
    <>
      {hydrated && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
            <Heart className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <p className="mt-6 text-lg font-medium">{dict.favorites.emptyTitle}</p>
          <p className="mt-2 max-w-sm text-sm text-muted dark:text-muted-dark">{dict.favorites.emptyText}</p>
          <Link href="/stations" className={buttonVariants({ className: "mt-6" })}>
            {dict.favorites.browseCatalog}
          </Link>
        </div>
      ) : (
        <ProductGrid products={items} className="mt-8" />
      )}
    </>
  );
}
