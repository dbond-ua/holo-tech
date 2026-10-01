"use client";

import type { BaseProduct } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function ProductGrid({ products, className }: { products: BaseProduct[]; className?: string }) {
  const { dict } = useI18n();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-line py-20 text-center dark:border-line-dark">
        <p className="text-lg font-medium">{dict.catalog.emptyTitle}</p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">{dict.catalog.emptyText}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
