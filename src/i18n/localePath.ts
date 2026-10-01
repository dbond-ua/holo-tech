import type { Locale } from "./config";

/**
 * Builds a locale-prefixed path, e.g. localePath("uk", "/stations") -> "/uk/stations"
 * Accepts paths with or without a leading slash; "" or "/" maps to the locale root.
 */
export function localePath(locale: Locale, path: string = ""): string {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}
