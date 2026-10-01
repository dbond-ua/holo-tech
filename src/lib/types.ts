export type CategorySlug =
  | "stations"
  | "inverters"
  | "batteries"
  | "solar-panels"
  | "kits"
  | "accessories";

/** A string translated for every supported locale. */
export interface Localized {
  uk: string;
  en: string;
}

/** A list of strings translated for every supported locale. */
export interface LocalizedList {
  uk: string[];
  en: string[];
}

export interface CategoryDef {
  slug: CategorySlug;
}

export type Brand =
  | "EcoFlow"
  | "OUKITEL"
  | "Bluetti"
  | "Anker SOLIX"
  | "Jackery"
  | "Zendure"
  | "Deye"
  | "Growatt"
  | "Victron Energy"
  | "Pylontech"
  | "Dyness";

export interface SpecEntry {
  label: string;
  value: string;
}

/** An admin-defined custom characteristic — added and edited from
 *  /admin/products, no code change needed to add a new one. `key` is a
 *  stable client-side list key only, never looked up server-side. Bilingual
 *  label+value so it renders correctly on both the /uk and /en storefront
 *  without a dictionary entry. Stored in products.extra_specs (jsonb array),
 *  see migrations/0005_extra_specs_array.sql. */
export interface ExtraSpecEntry {
  key: string;
  labelUk: string;
  labelEn: string;
  valueUk: string;
  valueEn: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified?: boolean;
}

export interface BaseProduct {
  id: string;
  slug: string;
  category: CategorySlug;
  brand: Brand;
  name: Localized;
  tagline: Localized;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount?: number;
  stockReserved?: number; // units held by unconfirmed orders — only meaningful when stockCount is tracked
  isNew?: boolean;
  isBestseller?: boolean;
  isDemo?: boolean;
  expandable?: boolean;
  highVoltage?: boolean;
  images: number; // number of gallery placeholder frames (used when imageUrls is empty)
  imageUrls?: string[]; // real uploaded photo URLs (served from local storage via /api/storage/products) — takes priority over generated art when present
  description: Localized;
  whatsIncluded: LocalizedList;
  reviews: Review[];
  features: LocalizedList;
  // station-specific (optional, used for filters/quiz/compare)
  powerW?: number;
  capacityWh?: number;
  outlets?: number;
  chargeTimeH?: number;
  batteryType?: string; // chemistry name, language-neutral (e.g. "LiFePO4")
  fastCharge?: boolean;
  isLiFePO4?: boolean;
  hasUPS?: boolean;
  solarCharging?: boolean;
  bluetooth?: boolean;
  wifi?: boolean;
  weightKg?: number;
  // inverter-specific
  phase?: "single" | "three";
  mppt?: number;
  inverterType?: "hybrid" | "grid" | "off-grid";
  // battery-specific
  voltageV?: number;
  capacityAh?: number;
  maxCurrentA?: number;
  cycles?: number;
  // admin-defined, no-code-change-needed custom characteristics
  extraSpecs?: ExtraSpecEntry[];
}

export interface KitProduct {
  id: string;
  slug: string;
  name: Localized;
  tier: "basic" | "comfort" | "max";
  inverterKw: number;
  batteryKwh: number;
  price: number;
  oldPrice?: number;
  runtimeHours: Localized;
  suitableFor: LocalizedList;
  description: Localized;
  specs: { uk: SpecEntry[]; en: SpecEntry[] };
  whatsIncluded: LocalizedList;
}
