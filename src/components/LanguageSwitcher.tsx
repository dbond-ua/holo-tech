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
    <div className={cn("inline-flex items-center gap-1.5", className)} role="group" aria-label="Language / Мова">
      {locales.map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-fg-3" aria-hidden="true">/</span>}
          <Link
            href={pathForLocale(pathname, l)}
            aria-current={l === locale ? "true" : undefined}
            className={cn(
              "transition-colors",
              l === locale ? "font-medium text-fg" : "text-fg-2 hover:text-fg"
            )}
          >
            {localeNames[l]}
          </Link>
        </span>
      ))}
    </div>
  );
}
