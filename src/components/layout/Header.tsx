"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Heart, ShoppingBag, User, ChevronDown, ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { brands, categorySlugs } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";
import { useStore } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Logo } from "@/components/layout/Logo";
import { cn, formatUAH } from "@/lib/utils";

/**
 * Three tiers on desktop:
 *   1. utility strip (delivery / service · phone, hours, language, theme)
 *   2. main row (wordmark · Каталог mega-menu · search · favorites, cart with sum)
 *   3. category row with the active section underlined in signal orange
 * The header is sticky at top: -32px, so the utility strip scrolls away on
 * its own (no JS, no layout shift) while rows 2–3 stay pinned.
 *
 * Mobile: one 56px row — menu · wordmark · search · cart. Section links live
 * in the menu sheet; the bottom tab bar handles the rest.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaCategory, setMegaCategory] = useState<CategorySlug>("stations");
  const megaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { cartCount, cartTotal, favorites, hydrated } = useStore();
  const { dict, locale } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMegaOpen(false);
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [megaOpen]);

  // Cmd/Ctrl+K and "/" open search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));
  const localePrefix = `/${locale}`;
  const active = categories.find((c) => pathname.startsWith(`${localePrefix}/${c.slug}`))?.slug;
  const mega = categories.find((c) => c.slug === megaCategory)!;
  const megaBrands = brands.filter((b) => (b.categories as readonly string[]).includes(megaCategory));
  const showCount = hydrated && cartCount > 0;

  return (
    <>
      <header
        ref={megaRef}
        className={cn(
          "sticky top-0 z-50 w-full bg-paper lg:-top-8",
          scrolled || megaOpen ? "border-b border-rule" : "border-b border-transparent"
        )}
      >
        {/* 1 — utility strip (desktop) */}
        <div className="hidden h-8 border-b border-rule lg:block">
          <div className="mx-auto flex h-full max-w-shell items-center justify-between px-10 text-[12px] text-fg-2">
            <p className="flex items-center gap-4">
              <span>{dict.ui.topbarDelivery}</span>
              <span className="text-fg-3" aria-hidden="true">·</span>
              <span>{dict.ui.topbarService}</span>
            </p>
            <div className="flex items-center gap-5">
              <a href={`tel:${dict.header.phone.replace(/\s/g, "")}`} className="num text-fg hover:underline">
                {dict.header.phone}
              </a>
              <span>{dict.footer.workingHours}</span>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* 2 — main row */}
        <div className="mx-auto flex h-14 max-w-shell items-center gap-2 px-2 sm:px-4 lg:h-16 lg:gap-6 lg:px-10">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-fg lg:hidden"
            aria-label={dict.header.menu}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-[22px] w-[22px]" strokeWidth={1.5} />
          </button>

          <Link href="/" aria-label="HoloTech" className="shrink-0">
            <Logo compact />
          </Link>

          <button
            type="button"
            onClick={() => setMegaOpen((v) => !v)}
            aria-expanded={megaOpen}
            aria-controls="mega-menu"
            className={cn(
              "hidden h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors lg:inline-flex",
              megaOpen ? "bg-fg text-paper" : "bg-fg/[0.06] text-fg hover:bg-fg/10"
            )}
          >
            {dict.header.catalog}
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", megaOpen && "rotate-180")} />
          </button>

          {/* Search: a real-looking field on desktop that opens the overlay. */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-10 min-w-0 flex-1 items-center gap-3 rounded-md border border-rule bg-panel px-3.5 text-left text-sm text-fg-3 transition-colors hover:border-fg/40 lg:flex"
          >
            <Search className="h-[18px] w-[18px] shrink-0 text-fg-2" strokeWidth={1.5} />
            <span className="truncate">{dict.ui.searchPlaceholder}</span>
            <kbd className="caption ml-auto hidden rounded-sm border border-rule px-1.5 py-0.5 text-fg-3 xl:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-0 lg:gap-1">
            <button
              type="button"
              aria-label={dict.header.search}
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-fg lg:hidden"
            >
              <Search className="h-[21px] w-[21px]" strokeWidth={1.5} />
            </button>

            <Link
              href="/favorites"
              aria-label={dict.header.favorites}
              className="relative hidden h-10 w-10 items-center justify-center rounded-md text-fg transition-colors hover:bg-fg/[0.06] lg:flex"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {hydrated && favorites.length > 0 && (
                <span className="num absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 text-[10px] font-semibold text-paper">
                  {favorites.length}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              aria-label={dict.header.profile}
              className="hidden h-10 w-10 items-center justify-center rounded-md text-fg transition-colors hover:bg-fg/[0.06] lg:flex"
            >
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>

            <Link
              href="/cart"
              aria-label={dict.header.cart}
              className="relative flex h-10 items-center gap-2.5 rounded-md px-2.5 text-fg transition-colors hover:bg-fg/[0.06] lg:ml-1 lg:border lg:border-rule lg:pl-3 lg:pr-3.5 lg:hover:border-fg/40 lg:hover:bg-transparent"
            >
              <span className="relative">
                <ShoppingBag className="h-[21px] w-[21px] lg:h-5 lg:w-5" strokeWidth={1.5} />
                {showCount && (
                  <span
                    key={cartCount}
                    className="anim-tick num absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold text-signal-ink"
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              <span className="hidden text-sm font-medium lg:inline">
                {showCount ? <span className="num">{formatUAH(cartTotal)}</span> : dict.header.cart}
              </span>
            </Link>
          </div>
        </div>

        {/* 3 — category row (desktop) */}
        <nav className="hidden border-t border-rule lg:block" aria-label={dict.header.catalog}>
          <div className="mx-auto flex h-11 max-w-shell items-stretch gap-7 px-10">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className={cn(
                  "relative flex items-center text-sm transition-colors",
                  active === c.slug ? "font-medium text-fg" : "text-fg-2 hover:text-fg"
                )}
              >
                {c.shortTitle}
                {active === c.slug && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-signal" />}
              </Link>
            ))}
            <span className="flex-1" />
            <Link href="/quiz" className="flex items-center gap-1.5 text-sm text-fg-2 transition-colors hover:text-fg">
              {dict.footer.quizLink}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <Link href="/compare" className="flex items-center text-sm text-fg-2 transition-colors hover:text-fg">
              {dict.footer.compareLink}
            </Link>
          </div>
        </nav>

        {/* Mega-menu */}
        {megaOpen && (
          <div
            id="mega-menu"
            className="anim-drop absolute inset-x-0 top-full hidden border-b border-rule bg-paper shadow-overlay lg:block"
          >
            <div className="mx-auto grid max-w-shell grid-cols-12 gap-0 px-10">
              <ul className="col-span-3 border-r border-rule py-6 pr-6">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.slug}`}
                      onMouseEnter={() => setMegaCategory(c.slug)}
                      onFocus={() => setMegaCategory(c.slug)}
                      className={cn(
                        "flex items-center justify-between rounded-sm px-3 py-2.5 text-[15px] transition-colors",
                        megaCategory === c.slug ? "bg-fg/[0.06] font-medium text-fg" : "text-fg-2 hover:text-fg"
                      )}
                    >
                      {c.title}
                      {megaCategory === c.slug && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="col-span-6 grid grid-cols-2 gap-8 px-8 py-8">
                <div>
                  <p className="caption text-fg-2">{dict.header.catalog}</p>
                  <p className="mt-3 text-h3 font-semibold">{mega.title}</p>
                  <p className="mt-2 text-sm text-fg-2">{mega.description}</p>
                  <Link
                    href={`/${mega.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {dict.ui.megaAll} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                  {megaBrands.length > 0 && (
                    <>
                      <p className="caption mt-8 text-fg-2">{dict.catalog.brandGroup}</p>
                      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {megaBrands.map((b) => (
                          <li key={b.name}>
                            <Link
                              href={`/${mega.slug}?brand=${encodeURIComponent(b.name)}`}
                              className="text-fg-2 transition-colors hover:text-fg"
                            >
                              {b.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <ProductVisual category={mega.slug} className="aspect-[4/3] self-start" />
              </div>

              <div className="col-span-3 border-l border-rule py-8 pl-8">
                <p className="caption text-fg-2">{dict.ui.megaQuiz}</p>
                <p className="mt-3 text-[15px] leading-snug">{dict.ui.megaQuizText}</p>
                <Link
                  href="/quiz"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-fg px-4 text-sm font-medium text-paper transition-colors hover:bg-fg/85"
                >
                  {dict.ui.heroQuiz} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
