"use client";

import { useEffect, useMemo, useState } from "react";
import type { BaseProduct } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Catalog grid as a spec sheet: cells separated by 1px hairlines (each cell
 * draws its right + bottom edge, the grid draws top + left), no gaps, no
 * floating cards.
 *
 * With `pageSize`, only the first `pageSize` products are rendered, plus a
 * "show more" button that reveals the next batch — a category can hold
 * thousands of products, and rendering them all at once would make the page
 * slow. The batch resets whenever the product list itself changes (filters,
 * sorting).
 */
export function ProductGrid({
  products,
  className,
  view = "grid",
  columns = "catalog",
  pageSize,
}: {
  products: BaseProduct[];
  className?: string;
  view?: "grid" | "list";
  columns?: "catalog" | "wide";
  pageSize?: number;
}) {
  const { dict } = useI18n();
  const [visible, setVisible] = useState(pageSize ?? Infinity);
  const signature = useMemo(() => products.map((p) => p.id).join(","), [products]);
  useEffect(() => setVisible(pageSize ?? Infinity), [signature, pageSize]);

  const shown = products.length > visible ? products.slice(0, visible) : products;
  const remaining = products.length - shown.length;
  const more =
    remaining > 0 && pageSize ? (
      <div className="flex justify-center pt-8">
        <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + pageSize)}>
          {dict.ui.showMore(Math.min(remaining, pageSize), remaining)}
        </Button>
      </div>
    ) : null;

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
      <>
        <ul className={cn("border-t border-rule", className)}>
          {shown.map((p) => (
            <li key={p.id} className="border-b border-rule">
              <ProductCard product={p} variant="list" />
            </li>
          ))}
        </ul>
        {more}
      </>
    );
  }

  return (
    <>
      <ul
        className={cn(
          "grid grid-cols-2 border-l border-t border-rule",
          columns === "wide" ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3",
          className
        )}
      >
        {shown.map((p, i) => (
          <li key={p.id} className="flex border-b border-r border-rule">
            <ProductCard product={p} className="w-full" priority={i < 4} />
          </li>
        ))}
      </ul>
      {more}
    </>
  );
}
