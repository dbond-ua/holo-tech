"use client";

import { useRef, useState } from "react";
import type { CategorySlug } from "@/lib/types";
import { ProductImage, ProductVisual } from "@/components/ui/ProductVisual";
import { cn } from "@/lib/utils";

/**
 * Desktop: vertical thumbnail rail + large square image on the stage.
 * Mobile: full-bleed horizontal swipe (scroll-snap) with a "1 / 5" counter.
 * Products without photos show the line drawing once (no fake frames).
 */
export function Gallery({
  category,
  imageUrls,
  alt,
}: {
  category: CategorySlug;
  productId?: string;
  count?: number;
  imageUrls?: string[];
  alt?: string;
}) {
  const images = imageUrls ?? [];
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return <ProductVisual category={category} className="-mx-4 aspect-[4/3] sm:-mx-6 sm:aspect-square lg:mx-0 lg:aspect-[5/4]" />;
  }

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div>
      {/* Mobile swipe */}
      <div className="relative -mx-4 sm:-mx-6 lg:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((src, i) => (
            <ProductImage
              key={src}
              src={src}
              alt={i === 0 ? alt ?? "" : ""}
              category={category}
              priority={i === 0}
              className="aspect-square w-full shrink-0 snap-center"
            />
          ))}
        </div>
        {images.length > 1 && (
          <span className="spec absolute bottom-3 right-4 rounded-sm bg-paper/80 px-2 py-1">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Desktop rail + stage */}
      <div className="hidden gap-4 lg:flex">
        {images.length > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-label={String(i + 1)}
                aria-current={active === i}
                className={cn(
                  "relative aspect-square overflow-hidden border transition-colors",
                  active === i ? "border-fg" : "border-transparent hover:border-rule"
                )}
              >
                <ProductImage src={src} alt="" category={category} compact className="absolute inset-0" />
              </button>
            ))}
          </div>
        )}
        <ProductImage
          src={images[active]}
          alt={alt ?? ""}
          category={category}
          priority
          className="aspect-square flex-1"
        />
      </div>
    </div>
  );
}
