"use client";

import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, favorites } = useStore();
  const { dict, locale } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);

  const localeRoot = `/${locale}`;
  const items = [
    { href: "/", label: dict.header.home, icon: Home },
    { href: "/stations", label: dict.header.catalog, icon: LayoutGrid },
  ] as const;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-line-dark dark:bg-surface-dark/95"
        aria-label={dict.header.catalog}
      >
        <div className="grid grid-cols-5">
          {items.map((item) => {
            const fullHref = item.href === "/" ? localeRoot : `${localeRoot}${item.href}`;
            const active = item.href === "/" ? pathname === localeRoot : pathname.startsWith(fullHref);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-ink dark:text-ink-dark" : "text-muted dark:text-muted-dark"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted dark:text-muted-dark"
          >
            <Search className="h-5 w-5" strokeWidth={1.8} />
            {dict.header.search}
          </button>

          <Link
            href="/favorites"
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              pathname.startsWith(`${localeRoot}/favorites`) ? "text-ink dark:text-ink-dark" : "text-muted dark:text-muted-dark"
            )}
          >
            <span className="relative">
              <Heart className="h-5 w-5" strokeWidth={pathname.startsWith(`${localeRoot}/favorites`) ? 2.4 : 1.8} />
              {favorites.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-white">
                  {favorites.length}
                </span>
              )}
            </span>
            {dict.header.favorites}
          </Link>

          <Link
            href="/cart"
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              pathname.startsWith(`${localeRoot}/cart`) ? "text-ink dark:text-ink-dark" : "text-muted dark:text-muted-dark"
            )}
          >
            <span className="relative">
              <ShoppingCart className="h-5 w-5" strokeWidth={pathname.startsWith(`${localeRoot}/cart`) ? 2.4 : 1.8} />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </span>
            {dict.header.cart}
          </Link>
        </div>
      </nav>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
