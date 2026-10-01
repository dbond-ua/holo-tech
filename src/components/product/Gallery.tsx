"use client";

import { useState } from "react";
import type { CategorySlug } from "@/lib/types";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { cn } from "@/lib/utils";

export function Gallery({
  category,
  productId,
  count,
  imageUrls,
  alt,
}: {
  category: CategorySlug;
  productId: string;
  count: number;
  imageUrls?: string[];
  alt?: string;
}) {
  const hasRealImages = Boolean(imageUrls && imageUrls.length > 0);
  const frames = hasRealImages
    ? imageUrls!
    : Array.from({ length: Math.max(count, 1) }, (_, i) => `${productId}-frame-${i}`);
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-xl3 border border-line bg-surface dark:border-line-dark dark:bg-surface-dark">
        {hasRealImages ? (
          <img
            src={frames[active]}
            alt={alt ?? ""}
            className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full p-8 transition-transform duration-500 ease-premium group-hover:scale-105 sm:p-12">
            <ProductVisual category={category} seed={frames[active]} className="h-full w-full" />
          </div>
        )}
      </div>
      {frames.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
          {frames.map((f, i) => (
            <button
              key={f}
              onClick={() => setActive(i)}
              aria-label={String(i + 1)}
              aria-current={active === i}
              className={cn(
                "aspect-square w-20 shrink-0 overflow-hidden rounded-xl2 border p-2 transition-all",
                active === i
                  ? "border-ink dark:border-white"
                  : "border-line opacity-70 hover:opacity-100 dark:border-line-dark"
              )}
            >
              {hasRealImages ? (
                <img src={f} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <ProductVisual category={category} seed={f} compact className="h-full w-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
