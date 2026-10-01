import "server-only";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { getDb } from "@/lib/db/client";
import type { ProductRow, KitRow, ProductReviewRow } from "@/lib/db/types";
import type { BaseProduct, KitProduct, CategorySlug, Review, ExtraSpecEntry } from "@/lib/types";
import {
  stations as demoStations,
  inverters as demoInverters,
  batteries as demoBatteries,
  solarPanels as demoSolarPanels,
  accessories as demoAccessories,
  kits as demoKits,
  allProducts as demoAllProducts,
  popularProducts as demoPopularProducts,
  getProductBySlug as demoGetProductBySlug,
  getKitBySlug as demoGetKitBySlug,
} from "@/lib/data";

/**
 * Unified catalog data-access layer: reads from the self-hosted PostgreSQL
 * database when configured, otherwise falls back transparently to the
 * static demo dataset in src/lib/data.ts. Every function returns the SAME
 * shapes (BaseProduct/KitProduct) either way, so page/component code never
 * needs to know which source is active — the storefront "just works" with
 * zero configuration and upgrades itself the moment DATABASE_URL is set,
 * with no code changes required anywhere else.
 *
 * All queries here are plain SELECTs run through the shared `sql` tagged
 * template (see src/lib/db/client.ts) — no writes happen in this file.
 */

// A products row plus the two joined columns every query below needs.
type ProductJoinRow = ProductRow & { category_slug: string | null; brand_name: string | null };

function mapReview(row: ProductReviewRow): Review {
  return {
    id: row.id,
    author: row.author,
    rating: row.rating,
    date: row.created_at,
    text: row.body,
    verified: row.verified,
  };
}

/** Narrows the jsonb `extra_specs` column (untyped at the DB level) into
 *  ExtraSpecEntry[], dropping anything malformed instead of throwing — a
 *  hand-edited row should degrade gracefully, not break the product page. */
function parseExtraSpecs(value: unknown): ExtraSpecEntry[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: ExtraSpecEntry[] = [];
  value.forEach((entry, i) => {
    if (!entry || typeof entry !== "object") return;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.labelUk === "string" &&
      typeof e.labelEn === "string" &&
      typeof e.valueUk === "string" &&
      typeof e.valueEn === "string"
    ) {
      rows.push({
        key: typeof e.key === "string" ? e.key : String(i),
        labelUk: e.labelUk,
        labelEn: e.labelEn,
        valueUk: e.valueUk,
        valueEn: e.valueEn,
      });
    }
  });
  return rows.length > 0 ? rows : undefined;
}

function mapProductRow(row: ProductJoinRow, reviews: ProductReviewRow[]): BaseProduct {
  return {
    id: row.id,
    slug: row.slug,
    category: (row.category_slug ?? "stations") as CategorySlug,
    brand: (row.brand_name ?? "") as BaseProduct["brand"],
    name: { uk: row.name_uk, en: row.name_en },
    tagline: { uk: row.tagline_uk, en: row.tagline_en },
    price: Number(row.price),
    oldPrice: row.old_price ? Number(row.old_price) : undefined,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    inStock: row.in_stock,
    stockCount: row.stock_count ?? undefined,
    stockReserved: row.stock_reserved,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    isDemo: row.is_demo,
    expandable: row.expandable,
    highVoltage: row.high_voltage,
    images: row.gallery_frame_count,
    imageUrls: row.images && row.images.length > 0 ? row.images : undefined,
    description: { uk: row.description_uk, en: row.description_en },
    whatsIncluded: { uk: row.whats_included_uk, en: row.whats_included_en },
    reviews: reviews.map(mapReview),
    features: { uk: row.features_uk, en: row.features_en },
    powerW: row.power_w ?? undefined,
    capacityWh: row.capacity_wh ?? undefined,
    outlets: row.outlets ?? undefined,
    chargeTimeH: row.charge_time_h ?? undefined,
    batteryType: row.battery_type ?? undefined,
    fastCharge: row.fast_charge ?? undefined,
    isLiFePO4: row.is_lifepo4 ?? undefined,
    hasUPS: row.has_ups ?? undefined,
    solarCharging: row.solar_charging ?? undefined,
    bluetooth: row.bluetooth ?? undefined,
    wifi: row.wifi ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    phase: row.phase ?? undefined,
    mppt: row.mppt ?? undefined,
    inverterType: row.inverter_type ?? undefined,
    voltageV: row.voltage_v ?? undefined,
    capacityAh: row.capacity_ah ?? undefined,
    maxCurrentA: row.max_current_a ?? undefined,
    cycles: row.cycles ?? undefined,
    extraSpecs: parseExtraSpecs(row.extra_specs),
  };
}

function mapKitRow(row: KitRow): KitProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: { uk: row.name_uk, en: row.name_en },
    tier: row.tier,
    inverterKw: Number(row.inverter_kw),
    batteryKwh: Number(row.battery_kwh),
    price: Number(row.price),
    oldPrice: row.old_price ? Number(row.old_price) : undefined,
    runtimeHours: { uk: row.runtime_hours_uk, en: row.runtime_hours_en },
    suitableFor: { uk: row.suitable_for_uk, en: row.suitable_for_en },
    description: { uk: row.description_uk, en: row.description_en },
    specs: row.specs,
    whatsIncluded: { uk: row.whats_included_uk, en: row.whats_included_en },
  };
}

/** Loads every review row for the given product ids in a single query and
 *  groups them by product_id — avoids an N+1 (one review query per product)
 *  for every catalog listing call. Returns an empty map for an empty input,
 *  no query issued. */
async function fetchReviewsByProductIds(
  productIds: string[]
): Promise<Map<string, ProductReviewRow[]>> {
  const grouped = new Map<string, ProductReviewRow[]>();
  if (productIds.length === 0) return grouped;

  const sql = getDb();
  if (!sql) return grouped;

  const rows = await sql<ProductReviewRow[]>`
    select * from product_reviews
    where product_id = any(${productIds})
    order by created_at desc
  `;
  for (const row of rows) {
    const list = grouped.get(row.product_id);
    if (list) list.push(row);
    else grouped.set(row.product_id, [row]);
  }
  return grouped;
}

/** Fetches every published product from the database, joined with its
 *  category slug and brand name, plus reviews — everything the mapper
 *  needs, in two round trips per call site. Returns null when the database
 *  isn't configured, or on query failure (falls back to demo data). */
async function fetchAllFromDb(): Promise<BaseProduct[] | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql<ProductJoinRow[]>`
      select p.*, c.slug as category_slug, b.name as brand_name
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true
    `;
    if (rows.length === 0) return [];

    const reviewsByProduct = await fetchReviewsByProductIds(rows.map((r) => r.id));
    return rows.map((row) => mapProductRow(row, reviewsByProduct.get(row.id) ?? []));
  } catch (err) {
    console.error("[catalog] failed to fetch products from the database, falling back to demo data", err);
    return null;
  }
}

async function fetchAllKitsFromDb(): Promise<KitProduct[] | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql<KitRow[]>`
      select * from kits where is_published = true
    `;
    return rows.map(mapKitRow);
  } catch (err) {
    console.error("[catalog] failed to fetch kits from the database, falling back to demo data", err);
    return null;
  }
}

export async function getAllProducts(): Promise<BaseProduct[]> {
  const fromDb = await fetchAllFromDb();
  return fromDb ?? demoAllProducts;
}

export async function getProductsByCategory(category: CategorySlug): Promise<BaseProduct[]> {
  const all = await getAllProducts();
  const fromCategory = all.filter((p) => p.category === category);
  // If the database is configured but simply has no products in this
  // category yet, keep showing the demo set for that category rather than
  // an empty catalog page — until the admin has added real products.
  if (fromCategory.length === 0 && IS_DB_CONFIGURED) {
    const demo = {
      stations: demoStations,
      inverters: demoInverters,
      batteries: demoBatteries,
      "solar-panels": demoSolarPanels,
      accessories: demoAccessories,
      kits: [] as BaseProduct[],
    }[category];
    return demo ?? [];
  }
  return fromCategory;
}

export async function getProductBySlug(category: CategorySlug, slug: string): Promise<BaseProduct | undefined> {
  const all = await getAllProducts();
  const found = all.find((p) => p.category === category && p.slug === slug);
  if (found) return found;
  return demoGetProductBySlug(category, slug);
}

export async function getPopularProducts(): Promise<BaseProduct[]> {
  const all = await getAllProducts();
  const homepageProducts = IS_DB_CONFIGURED ? await fetchHomepageProductsFromDb() : null;
  if (homepageProducts && homepageProducts.length > 0) return homepageProducts;
  return all.length > 0 && IS_DB_CONFIGURED ? all.slice(0, 8) : demoPopularProducts;
}

async function fetchHomepageProductsFromDb(): Promise<BaseProduct[] | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql<ProductJoinRow[]>`
      select p.*, c.slug as category_slug, b.name as brand_name
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true and p.show_on_homepage = true
      order by p.homepage_sort_order
    `;
    if (rows.length === 0) return null;

    const reviewsByProduct = await fetchReviewsByProductIds(rows.map((r) => r.id));
    return rows.map((row) => mapProductRow(row, reviewsByProduct.get(row.id) ?? []));
  } catch (err) {
    console.error("[catalog] failed to fetch homepage products from the database", err);
    return null;
  }
}

export async function getKits(): Promise<KitProduct[]> {
  const fromDb = await fetchAllKitsFromDb();
  if (fromDb && fromDb.length > 0) return fromDb;
  return demoKits;
}

export async function getKitBySlug(slug: string): Promise<KitProduct | undefined> {
  const kits = await getKits();
  return kits.find((k) => k.slug === slug) ?? demoGetKitBySlug(slug);
}
