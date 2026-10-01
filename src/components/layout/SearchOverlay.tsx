"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { allProducts, categorySlugs, brandLogos } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { PriceTag } from "@/components/ui/PriceTag";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
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

  const productResults = useMemo(() => {
    if (!q) return [];
    return allProducts
      .filter((p) => p.name[locale].toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      .slice(0, 6);
  }, [q, locale]);

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto rounded-b-2xl bg-surface shadow-lift animate-slide-down dark:bg-surface-dark">
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-full border border-line px-4 py-3 dark:border-line-dark">
            <Search className="h-5 w-5 shrink-0 text-muted dark:text-muted-dark" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.search.placeholder}
              className="w-full bg-transparent text-base outline-none placeholder:text-muted dark:placeholder:text-muted-dark"
              aria-label={dict.header.search}
            />
            <button
              onClick={onClose}
              aria-label={dict.common.close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pb-10 pt-6">
            {!q && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted dark:text-muted-dark">
                  {dict.search.popularCategories}
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/${c.slug}`}
                      onClick={onClose}
                      className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:bg-black/[0.03] dark:border-line-dark dark:hover:bg-white/[0.06]"
                    >
                      {c.emoji} {c.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {q && !hasResults && (
              <p className="py-8 text-center text-muted dark:text-muted-dark">{dict.search.noResults(query)}</p>
            )}

            {productResults.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted dark:text-muted-dark">
                  {dict.search.productsLabel}
                </p>
                <div className="flex flex-col gap-1">
                  {productResults.map((p) => (
                    <Link
                      key={p.id}
                      href={`/${p.category}/${p.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <ProductVisual category={p.category} seed={p.id} compact className="h-12 w-12 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name[locale]}</p>
                        <p className="truncate text-xs text-muted dark:text-muted-dark">{p.brand}</p>
                      </div>
                      <PriceTag price={p.price} size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {categoryResults.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted dark:text-muted-dark">
                  {dict.search.categoriesLabel}
                </p>
                <div className="flex flex-col gap-1">
                  {categoryResults.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/${c.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between rounded-xl px-2 py-2 text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <span>{c.emoji} {c.title}</span>
                      <ArrowRight className="h-4 w-4 text-muted dark:text-muted-dark" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {brandResults.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted dark:text-muted-dark">
                  {dict.search.brandsLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {brandResults.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-line px-4 py-2 text-sm dark:border-line-dark"
                    >
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
