"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { BaseProduct } from "@/lib/types";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ProductImage } from "@/components/ui/ProductVisual";
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
      <div className="border-t border-fg py-10">
        <p className="text-h3 font-semibold">{dict.compare.emptyTitle}</p>
        <p className="mt-2 text-fg-2">{dict.compare.emptyText}</p>
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
    <div className="-mx-4 overflow-x-auto sm:-mx-6 lg:mx-0">
      <table className="w-full min-w-[640px] border-collapse text-[15px]">
        <thead>
          <tr className="border-t border-fg">
            <th className="sticky left-0 z-10 w-44 bg-paper p-4 text-left align-bottom" />
            {products.map((p) => (
              <th key={p.id} className="min-w-[220px] border-l border-rule p-4 text-left align-top font-normal">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Link href={`/${p.category}/${p.slug}`} className="block">
                      <ProductImage src={p.imageUrls?.[0]} alt={p.name[locale]} category={p.category} className="aspect-[4/3] w-full" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(p.id)}
                      aria-label={dict.compare.remove}
                      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-fg-2 transition-colors hover:text-fg"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div>
                    <p className="caption text-fg-2">{p.brand}</p>
                    <Link href={`/${p.category}/${p.slug}`} className="mt-1 block font-medium leading-snug hover:underline">
                      {p.name[locale]}
                    </Link>
                  </div>
                  <PriceTag price={p.price} oldPrice={p.oldPrice} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-rule">
              <th className="sticky left-0 z-10 w-44 bg-paper p-4 text-left text-sm font-normal text-fg-2">
                {row.label}
              </th>
              {products.map((p) => (
                <td key={p.id} className="num border-l border-rule p-4 font-medium">
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
