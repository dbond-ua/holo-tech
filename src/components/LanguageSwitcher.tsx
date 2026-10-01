"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Compact "UA | EN" switcher that swaps only the leading locale segment of
 * the current path, preserving the rest of the URL (and query string) so the
 * user stays on the same page after switching languages.
 */
function pathForLocale(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  // segments[0] is "" (leading slash), segments[1] is the current locale
  segments[1] = target;
  return segments.join("/") || `/${target}`;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale } = useI18n();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line p-0.5 text-xs font-semibold dark:border-line-dark",
        className
      )}
      role="group"
      aria-label="Language / Мова"
    >
      {locales.map((l) => (
        <Link
          key={l}
          href={pathForLocale(pathname, l)}
          aria-current={l === locale ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            l === locale
              ? "bg-ink text-white dark:bg-white dark:text-ink"
              : "text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
          )}
        >
          {localeNames[l]}
        </Link>
      ))}
    </div>
  );
}
