"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { localePath } from "@/i18n/localePath";

type LinkProps = ComponentProps<typeof Link>;

/**
 * Drop-in replacement for next/link that automatically prefixes internal
 * hrefs with the current locale, e.g. href="/stations" -> "/uk/stations".
 * External links (http/https/mailto/tel) and already-prefixed hrefs pass through unchanged.
 */
export function LocalizedLink({ href, ...props }: LinkProps) {
  const { locale } = useI18n();

  let resolvedHref = href;
  if (typeof href === "string") {
    const isExternal = /^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    const alreadyLocalized = href.startsWith(`/uk`) || href.startsWith(`/en`);
    resolvedHref = isExternal || alreadyLocalized ? href : localePath(locale, href);
  }

  return <Link href={resolvedHref} {...props} />;
}
