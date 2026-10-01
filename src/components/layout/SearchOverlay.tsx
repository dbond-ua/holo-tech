"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { allProducts, categorySlugs, brandLogos } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";
import { ProductImage } from "@/components/ui/ProductVisual";
import { getSpecLine } from "@/lib/product-ui";
import { formatUAH } from "@/lib/utils";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", onKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open, onClose]);

  const categories = useMemo(
    () => categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] })),
    [dict]
  );

  const q = query.trim().toLowerCase();
  // "2000", "2000 вт", "1024wh" — match power or capacity by number too.
  const qNumber = Number((q.match(/\d+/) ?? [""])[0]) || null;

  const productResults = useMemo(() => {
    if (!q) return [];
    return allProducts
      .filter(
        (p) =>
          p.name[locale].toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (qNumber !== null && (p.powerW === qNumber || p.capacityWh === qNumber))
      )
      .slice(0, 6);
  }, [q, qNumber, locale]);

  const categoryResults = useMemo(() => {
    if (!q) return [];
    return categories.filter((c) => c.title.toLowerCase().includes(q));
  }, [q, categories]);

  const brandResults = useMemo(() => {
    if (!q) return [];
    return brandLogos.filter((b) => b.toLowerCase().includes(q));
  }, [q]);

  const hasResults = productResults.length || categoryResults.length || brandResults.length;

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label={dict.header.search}>
      <div className="anim-fade absolute inset-0 bg-[rgb(12_12_11/0.45)]" onClick={onClose} />
      <div className="anim-drop absolute inset-x-0 top-0 max-h-[90dvh] overflow-y-auto border-b border-rule bg-paper shadow-overlay">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3 border-b border-fg sm:h-20">
            <Search className="h-5 w-5 shrink-0 text-fg-2" strokeWidth={1.5} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.ui.searchPlaceholder}
              className="w-full bg-transparent text-lg outline-none placeholder:text-fg-3 sm:text-xl"
              aria-label={dict.header.search}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.common.close}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-fg-2 transition-colors hover:text-fg"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="pb-10 pt-6">
            {!q && (
              <div>
                <p className="caption mb-3 text-fg-2">{dict.search.popularCategories}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/${c.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between border-b border-rule py-3 text-[15px] transition-colors hover:text-fg-2 sm:mr-6"
                      >
                        {c.title}
                        <ArrowRight className="h-4 w-4 text-fg-3" strokeWidth={1.5} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {q && !hasResults && <p className="py-8 text-fg-2">{dict.search.noResults(query)}</p>}

            {productResults.length > 0 && (
              <div className="mb-8">
                <p className="caption mb-2 text-fg-2">{dict.search.productsLabel}</p>
                <ul>
                  {productResults.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/${p.category}/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 border-b border-rule py-2.5 transition-colors hover:bg-fg/[0.03]"
                      >
                        <ProductImage
                          src={p.imageUrls?.[0]}
                          alt=""
                          category={p.category}
                          compact
                          className="h-14 w-16 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{p.name[locale]}</p>
                          <p className="spec truncate text-fg-2">{getSpecLine(p, dict).join(" · ") || p.brand}</p>
                        </div>
                        <span className="num shrink-0 text-[15px] font-semibold">{formatUAH(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {categoryResults.length > 0 && (
              <div className="mb-8">
                <p className="caption mb-2 text-fg-2">{dict.search.categoriesLabel}</p>
                <ul>
                  {categoryResults.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/${c.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between border-b border-rule py-3 text-[15px]"
                      >
                        {c.title}
                        <ArrowRight className="h-4 w-4 text-fg-3" strokeWidth={1.5} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {brandResults.length > 0 && (
              <div>
                <p className="caption mb-3 text-fg-2">{dict.search.brandsLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {brandResults.map((b) => (
                    <span key={b} className="rounded-sm border border-rule px-3 py-1.5 text-sm">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
