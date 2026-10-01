"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { BaseProduct } from "@/lib/types";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { PriceTag } from "@/components/ui/PriceTag";
import { formatUAH } from "@/lib/utils";
import { buildSpecs } from "@/lib/specs";
import { useI18n } from "@/i18n/I18nProvider";

export function CompareTable({
  products,
  onRemove,
}: {
  products: BaseProduct[];
  onRemove: (id: string) => void;
}) {
  const { locale, dict } = useI18n();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-line py-16 text-center dark:border-line-dark">
        <p className="font-medium">{dict.compare.emptyTitle}</p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">{dict.compare.emptyText}</p>
      </div>
    );
  }

  const specsByProduct = new Map(products.map((p) => [p.id, buildSpecs(p, dict, locale)]));
  const labelSet: string[] = [];
  for (const p of products) {
    for (const row of specsByProduct.get(p.id) ?? []) {
      if (!labelSet.includes(row.label)) labelSet.push(row.label);
    }
  }

  const rows: { label: string; render: (p: BaseProduct) => ReactNode }[] = labelSet.map((label) => ({
    label,
    render: (p) => {
      const row = specsByProduct.get(p.id)?.find((r) => r.label === label);
      return row ? row.value : "—";
    },
  }));

  rows.push(
    { label: dict.specs.rating, render: (p) => `${p.rating.toFixed(1)} (${p.reviewsCount})` },
    { label: dict.specs.price, render: (p) => formatUAH(p.price) }
  );

  return (
    <div className="overflow-x-auto rounded-xl2 border border-line dark:border-line-dark">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-40 bg-surface p-4 text-left align-bottom dark:bg-surface-dark" />
            {products.map((p) => (
              <th key={p.id} className="min-w-[200px] border-l border-line p-4 align-bottom dark:border-line-dark">
                <div className="flex flex-col items-start gap-3">
                  <button
                    onClick={() => onRemove(p.id)}
                    aria-label={dict.compare.remove}
                    className="self-end rounded-full p-1 text-muted transition-colors hover:bg-black/[0.05] hover:text-ink dark:text-muted-dark dark:hover:bg-white/10 dark:hover:text-ink-dark"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Link href={`/${p.category}/${p.slug}`} className="w-full">
                    <ProductVisual category={p.category} seed={p.id} className="aspect-square w-full" compact={false} />
                  </Link>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted dark:text-muted-dark">{p.brand}</p>
                    <Link href={`/${p.category}/${p.slug}`} className="text-sm font-semibold hover:underline">
                      {p.name[locale]}
                    </Link>
                  </div>
                  <PriceTag price={p.price} oldPrice={p.oldPrice} size="sm" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 1 ? "bg-black/[0.02] dark:bg-white/[0.03]" : ""}>
              <th className="sticky left-0 z-10 w-40 bg-inherit p-4 text-left text-sm font-medium text-muted dark:text-muted-dark">
                {row.label}
              </th>
              {products.map((p) => (
                <td key={p.id} className="border-l border-line p-4 text-center dark:border-line-dark">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
