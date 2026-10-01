"use client";

import { ChevronRight, User, Heart, Phone } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";
import { Sheet } from "@/components/ui/Sheet";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict } = useI18n();
  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));

  return (
    <Sheet open={open} onClose={onClose} side="left" title={dict.header.catalog} widthClassName="w-full max-w-xs">
      <nav className="flex flex-col p-2" aria-label={dict.header.catalog}>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{c.emoji}</span> {c.title}
            </span>
            <ChevronRight className="h-4 w-4 text-muted dark:text-muted-dark" />
          </Link>
        ))}

        <div className="my-2 border-t border-line dark:border-line-dark" />

        <Link
          href="/compare"
          className="rounded-xl px-3 py-3.5 text-base font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          {dict.footer.compareLink}
        </Link>
        <Link
          href="/quiz"
          className="rounded-xl px-3 py-3.5 text-base font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          {dict.footer.quizLink}
        </Link>
        <Link
          href="/favorites"
          className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          <Heart className="h-5 w-5" /> {dict.header.favorites}
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          <User className="h-5 w-5" /> {dict.header.profile}
        </Link>

        <div className="my-2 border-t border-line dark:border-line-dark" />

        <div className="flex items-center justify-between px-3 py-3">
          <span className="flex items-center gap-3 text-sm text-muted dark:text-muted-dark">
            <Phone className="h-4 w-4" /> {dict.header.phone}
          </span>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </Sheet>
  );
}
