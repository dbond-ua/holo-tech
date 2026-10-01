import type { MetadataRoute } from "next";
import { categorySlugs, allProducts, kits } from "@/lib/data";
import { locales, SITE_URL } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";

const STATIC_PATHS = ["", "/compare", "/quiz", "/cart", "/checkout", "/favorites", "/profile"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const alternates = (path: string) =>
    Object.fromEntries(locales.map((l) => [l, `${SITE_URL}${localePath(l, path)}`]));

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}${localePath(locale, path)}`,
        lastModified: new Date(),
        alternates: { languages: alternates(path) },
      });
    }
  }

  for (const slug of categorySlugs) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}${localePath(locale, `/${slug}`)}`,
        lastModified: new Date(),
        alternates: { languages: alternates(`/${slug}`) },
      });
    }
  }

  for (const p of allProducts) {
    const path = `/${p.category}/${p.slug}`;
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}${localePath(locale, path)}`,
        lastModified: new Date(),
        alternates: { languages: alternates(path) },
      });
    }
  }

  for (const k of kits) {
    const path = `/kits/${k.slug}`;
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}${localePath(locale, path)}`,
        lastModified: new Date(),
        alternates: { languages: alternates(path) },
      });
    }
  }

  return entries;
}
