"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionary.types";
import { getDictionary } from "./getDictionary";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Only `locale` (a plain string) crosses the server/client boundary as a
 * prop — the dictionary itself is built here, on the client, by calling
 * getDictionary(locale) locally. Several Dictionary fields are functions
 * (e.g. common.inStockCount, cart.itemsLabel), and Next.js cannot serialize
 * functions passed as props from a Server Component into a Client
 * Component, so the full dict object must never be passed in from the
 * server layout — only reconstructed client-side from the locale.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = useMemo(() => getDictionary(locale), [locale]);
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
