import type { Locale } from "./config";
import type { Dictionary } from "./dictionary.types";
import { uk } from "./dictionaries/uk";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { uk, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.uk;
}
