"use client";

import type { BaseProduct } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Catalog grid as a spec sheet: cells separated by 1px hairlines (each cell
 * draws its right + bottom edge, the grid draws top + left), no gaps, no
 * floating cards.
 */
export function ProductGrid({
  products,
  className,
  view = "grid",
  columns = "catalog",
}: {
  products: BaseProduct[];
  className?: string;
  view?: "grid" | "list";
  columns?: "catalog" | "wide";
}) {
  const { dict } = useI18n();

  if (products.length === 0) {
    return (
      <div className={cn("border-y border-rule py-16", className)}>
        <p className="text-h3 font-semibold">{dict.catalog.emptyTitle}</p>
        <p className="mt-2 text-fg-2">{dict.catalog.emptyText}</p>
      </div>
    );
  }

  if (view === "list") {
    return (
      <ul className={cn("border-t border-rule", className)}>
        {products.map((p) => (
          <li key={p.id} className="border-b border-rule">
            <ProductCard product={p} variant="list" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-2 border-l border-t border-rule",
        columns === "wide" ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3",
        className
      )}
    >
      {products.map((p, i) => (
        <li key={p.id} className="flex border-b border-r border-rule">
          <ProductCard product={p} className="w-full" priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
