"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Gauge, Heart } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { MobileNav } from "@/components/layout/MobileNav";
import { categorySlugs } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Mobile tab bar: Головна · Каталог (opens the category sheet) · Підбір ·
 * Обране. Search and cart live in the header, so nothing is duplicated.
 * Hidden on screens that carry their own sticky action bar (product page,
 * cart, checkout) — see `hasOwnActionBar`.
 */
function hasOwnActionBar(pathname: string, locale: string): boolean {
  const rest = pathname.replace(new RegExp(`^/${locale}`), "");
  if (rest.startsWith("/cart") || rest.startsWith("/checkout")) return true;
  const [, first, second] = rest.split("/");
  return Boolean(second) && (categorySlugs as string[]).includes(first);
}

export function BottomNav() {
  const pathname = usePathname();
  const { favorites, hydrated } = useStore();
  const { dict, locale } = useI18n();
  const [catalogOpen, setCatalogOpen] = useState(false);

  if (hasOwnActionBar(pathname, locale)) return null;

  const root = `/${locale}`;
  const isHome = pathname === root;
  const isQuiz = pathname.startsWith(`${root}/quiz`);
  const isFav = pathname.startsWith(`${root}/favorites`);
  const isCatalog = categorySlugs.some((c) => pathname.startsWith(`${root}/${c}`));

  const item = (on: boolean) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px]",
      on ? "font-medium text-fg" : "text-fg-2"
    );
  const marker = (on: boolean) => on && <span className="absolute inset-x-6 top-0 h-0.5 bg-fg" />;

  return (
    <>
      {/* Spacer so page content clears the fixed bar. */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] lg:hidden" aria-hidden="true" />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label={dict.header.menu}
      >
        <div className="grid h-14 grid-cols-4">
          <Link href="/" className={item(isHome)}>
            {marker(isHome)}
            <Home className="h-5 w-5" strokeWidth={1.5} />
            {dict.header.home}
          </Link>
          <button type="button" onClick={() => setCatalogOpen(true)} className={item(isCatalog)}>
            {marker(isCatalog)}
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
            {dict.header.catalog}
          </button>
          <Link href="/quiz" className={item(isQuiz)}>
            {marker(isQuiz)}
            <Gauge className="h-5 w-5" strokeWidth={1.5} />
            {dict.ui.tabQuiz}
          </Link>
          <Link href="/favorites" className={item(isFav)}>
            {marker(isFav)}
            <span className="relative">
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {hydrated && favorites.length > 0 && (
                <span className="num absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-fg px-1 text-[9px] font-semibold text-paper">
                  {favorites.length}
                </span>
              )}
            </span>
            {dict.header.favorites}
          </Link>
        </div>
      </nav>
      <MobileNav open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </>
  );
}
