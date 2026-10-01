export const locales = ["uk", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const localeNames: Record<Locale, string> = {
  uk: "UA",
  en: "EN",
};

/** BCP-47 tags used for <html lang>, hreflang and Open Graph locale */
export const localeTags: Record<Locale, string> = {
  uk: "uk-UA",
  en: "en",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Site base URL used for canonical / hreflang / sitemap generation */
export const SITE_URL = "https://holotech.store";
export const SITE_NAME = "HoloTech";
