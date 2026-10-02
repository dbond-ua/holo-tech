"use client";

import { ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";
import { Sheet } from "@/components/ui/Sheet";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ProductVisual } from "@/components/ui/ProductVisual";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict } = useI18n();
  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));

  const secondary = [
    { href: "/quiz", label: dict.footer.quizLink },
    { href: "/compare", label: dict.footer.compareLink },
    { href: "/favorites", label: dict.header.favorites },
    { href: "/profile", label: dict.header.profile },
  ];

  return (
    <Sheet open={open} onClose={onClose} side="left" title={dict.header.catalog} widthClassName="w-[88vw] max-w-sm">
      <nav aria-label={dict.header.catalog}>
        <ul>
          {categories.map((c, i) => (
            <li key={c.slug} className="border-b border-rule">
              <Link
                href={`/${c.slug}`}
                onClick={onClose}
                className="flex items-center gap-4 px-5 py-3 active:bg-fg/[0.04]"
              >
                <ProductVisual category={c.slug} compact className="h-12 w-14 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="caption block text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="block text-[15px] font-medium">{c.title}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-fg-2" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>

        <ul className="px-5 py-4">
          {secondary.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={onClose} className="block py-2.5 text-[15px] text-fg-2">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mx-5 flex items-center justify-between border-t border-rule py-4 text-sm">
          <a href={`tel:${dict.header.phone.replace(/\s/g, "")}`} className="num font-medium">
            {dict.header.phone}
          </a>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <p className="px-5 pb-6 text-[13px] text-fg-2">{dict.footer.workingHours}</p>
      </nav>
    </Sheet>
  );
}
