"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Heart, ShoppingCart, User, Zap } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, favorites } = useStore();
  const { dict, locale } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));
  const localePrefix = `/${locale}`;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 ease-premium",
          scrolled
            ? "border-b border-line bg-surface/80 backdrop-blur-lg dark:border-line-dark dark:bg-surface-dark/80"
            : "border-b border-transparent bg-canvas/60 backdrop-blur-sm dark:bg-canvas-dark/60"
        )}
      >
        <div className="mx-auto flex h-16 max-w-8xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] lg:hidden dark:hover:bg-white/10"
            aria-label={dict.header.menu}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="hidden text-lg sm:inline">HoloTech</span>
          </Link>

          <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex" aria-label={dict.header.catalog}>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(`${localePrefix}/${c.slug}`)
                    ? "bg-black/[0.05] text-ink dark:bg-white/10 dark:text-ink-dark"
                    : "text-muted hover:bg-black/[0.04] hover:text-ink dark:text-muted-dark dark:hover:bg-white/[0.06] dark:hover:text-ink-dark"
                )}
              >
                {c.shortTitle}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              aria-label={dict.header.search}
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] dark:hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link
              href="/favorites"
              aria-label={dict.header.favorites}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] sm:flex dark:hover:bg-white/10"
            >
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              aria-label={dict.header.cart}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] dark:hover:bg-white/10"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              aria-label={dict.header.profile}
              className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] lg:flex dark:hover:bg-white/10"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
