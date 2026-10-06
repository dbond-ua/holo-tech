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

/**
 * Columns for catalog listings and product cards: everything a ProductCard,
 * the catalog filters, search results and the homepage read — but NOT the
 * long text fields (descriptions, features, what's included, extra specs)
 * nor more than two photos. Those are only needed on the product page and
 * would bloat a category page that holds thousands of products. The heavy
 * fields come back as empty values so every row still maps to a complete
 * BaseProduct via mapProductRow().
 *
 * A fixed, hand-written string (never built from input), used through
 * sql.unsafe() as a query fragment — see the note in src/lib/db/client.ts.
 */
const LIST_SELECT = `
  p.id, p.slug, p.category_id, p.brand_id, p.name_uk, p.name_en, p.tagline_uk, p.tagline_en,
  '' as description_uk, '' as description_en,
  '{}'::text[] as whats_included_uk, '{}'::text[] as whats_included_en,
  '{}'::text[] as features_uk, '{}'::text[] as features_en,
  '[]'::jsonb as extra_specs,
  p.price, p.old_price, p.in_stock, p.stock_count, p.stock_reserved,
  p.is_new, p.is_bestseller, p.is_demo, p.expandable, p.high_voltage,
  p.power_w, p.capacity_wh, p.outlets, p.charge_time_h, p.battery_type, p.fast_charge,
  p.is_lifepo4, p.has_ups, p.solar_charging, p.bluetooth, p.wifi, p.weight_kg,
  p.phase, p.mppt, p.inverter_type, p.voltage_v, p.capacity_ah, p.max_current_a, p.cycles,
  p.images[1:2] as images, p.gallery_frame_count, p.rating, p.reviews_count,
  c.slug as category_slug, b.name as brand_name
`;

const demoByCategory: Record<CategorySlug, BaseProduct[]> = {
  stations: demoStations,
  inverters: demoInverters,
  batteries: demoBatteries,
  "solar-panels": demoSolarPanels,
  accessories: demoAccessories,
  kits: [],
};

/** Strips the long text fields from a demo product the same way LIST_SELECT
 *  does for database rows, so listings are equally light in demo mode. */
function toListItem(p: BaseProduct): BaseProduct {
  return {
    ...p,
    description: { uk: "", en: "" },
    whatsIncluded: { uk: [], en: [] },
    features: { uk: [], en: [] },
    reviews: [],
    extraSpecs: undefined,
  };
}

/** Runs a listing query and maps the rows (no reviews — cards only need the
 *  rating/reviews_count columns). Returns null when the database isn't
 *  configured or the query fails, so callers fall back to demo data. */
async function listFromDb(
  build: (sql: NonNullable<ReturnType<typeof getDb>>) => Promise<ProductJoinRow[]>,
  what: string
): Promise<BaseProduct[] | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;
  try {
    const rows = await build(sql);
    return rows.map((row) => mapProductRow(row, []));
  } catch (err) {
    console.error(`[catalog] failed to fetch ${what} from the database, falling back to demo data`, err);
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

/** Published products of one category, lightweight (see LIST_SELECT). */
export async function getProductsByCategory(category: CategorySlug): Promise<BaseProduct[]> {
  const fromDb = await listFromDb(
    (sql) => sql<ProductJoinRow[]>`
      select ${sql.unsafe(LIST_SELECT)}
      from products p
      join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true and c.slug = ${category}
      order by p.is_bestseller desc, p.reviews_count desc, p.created_at desc
    `,
    `category ${category}`
  );
  // If the database is configured but simply has no products in this
  // category yet, keep showing the demo set for that category rather than
  // an empty catalog page — until the admin has added real products.
  if (fromDb && fromDb.length > 0) return fromDb;
  return (demoByCategory[category] ?? []).map(toListItem);
}

/** One product with everything the product page needs (full text, all
 *  photos, reviews). Falls back to the demo dataset when not in the DB. */
export async function getProductBySlug(category: CategorySlug, slug: string): Promise<BaseProduct | undefined> {
  if (IS_DB_CONFIGURED) {
    const sql = getDb();
    if (sql) {
      try {
        const [row] = await sql<ProductJoinRow[]>`
          select p.*, c.slug as category_slug, b.name as brand_name
          from products p
          join categories c on c.id = p.category_id
          left join brands b on b.id = p.brand_id
          where p.is_published = true and p.slug = ${slug} and c.slug = ${category}
          limit 1
        `;
        if (row) {
          const reviews = await fetchReviewsByProductIds([row.id]);
          return mapProductRow(row, reviews.get(row.id) ?? []);
        }
      } catch (err) {
        console.error("[catalog] failed to fetch product from the database, falling back to demo data", err);
      }
    }
  }
  return demoGetProductBySlug(category, slug);
}

/** A few other products from the same category for the "related" block. */
export async function getRelatedProducts(
  category: CategorySlug,
  excludeId: string,
  limit = 4
): Promise<BaseProduct[]> {
  const fromDb = await listFromDb(
    (sql) => sql<ProductJoinRow[]>`
      select ${sql.unsafe(LIST_SELECT)}
      from products p
      join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true and c.slug = ${category} and p.id::text <> ${excludeId}
      order by p.in_stock desc, p.is_bestseller desc, p.reviews_count desc, p.created_at desc
      limit ${limit}
    `,
    `related products for ${category}`
  );
  if (fromDb && fromDb.length > 0) return fromDb;
  return (demoByCategory[category] ?? [])
    .filter((p) => p.id !== excludeId)
    .slice(0, limit)
    .map(toListItem);
}

/** Number of published products per category, matching what each catalog
 *  page shows (a category that is still empty in the DB shows demo items). */
export async function getCategoryCounts(): Promise<Partial<Record<CategorySlug, number>>> {
  const counts: Partial<Record<CategorySlug, number>> = {};
  for (const [slug, items] of Object.entries(demoByCategory)) counts[slug as CategorySlug] = items.length;
  if (!IS_DB_CONFIGURED) return counts;
  const sql = getDb();
  if (!sql) return counts;
  try {
    const rows = await sql<{ slug: string; n: number }[]>`
      select c.slug, count(*)::int as n
      from products p
      join categories c on c.id = p.category_id
      where p.is_published = true
      group by c.slug
    `;
    for (const r of rows) if (r.n > 0) counts[r.slug as CategorySlug] = r.n;
  } catch (err) {
    console.error("[catalog] failed to count products per category", err);
  }
  return counts;
}

/** Homepage hero: the newest in-stock station with the largest capacity,
 *  else the demo flagship, else any in-stock station. */
export async function getHeroProduct(): Promise<BaseProduct | undefined> {
  const fromDb = await listFromDb(
    (sql) => sql<ProductJoinRow[]>`
      select ${sql.unsafe(LIST_SELECT)}
      from products p
      join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true and c.slug = 'stations' and p.in_stock = true
      order by p.is_new desc, p.capacity_wh desc nulls last
      limit 1
    `,
    "hero product"
  );
  if (fromDb?.[0]?.isNew) return fromDb[0];
  const flagship = await getProductBySlug("stations", "ecoflow-delta-pro-3");
  if (flagship) return flagship;
  if (fromDb?.[0]) return fromDb[0];
  const demo = demoStations.filter((p) => p.inStock);
  return demo.filter((p) => p.isNew).sort((a, b) => (b.capacityWh ?? 0) - (a.capacityWh ?? 0))[0] ?? demo[0];
}

export async function getPopularProducts(): Promise<BaseProduct[]> {
  const homepageProducts = await listFromDb(
    (sql) => sql<ProductJoinRow[]>`
      select ${sql.unsafe(LIST_SELECT)}
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true and p.show_on_homepage = true
      order by p.homepage_sort_order
    `,
    "homepage products"
  );
  if (homepageProducts && homepageProducts.length > 0) return homepageProducts;
  const firstEight = await listFromDb(
    (sql) => sql<ProductJoinRow[]>`
      select ${sql.unsafe(LIST_SELECT)}
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true
      order by p.is_bestseller desc, p.reviews_count desc, p.created_at desc
      limit 8
    `,
    "popular products"
  );
  if (firstEight && firstEight.length > 0) return firstEight;
  return demoPopularProducts.map(toListItem);
}

/** Header search: name / brand substring, or an exact wattage / capacity
 *  ("2000", "1024 wh"). Lightweight rows, in-stock items first. */
export async function searchProducts(query: string, limit = 6): Promise<BaseProduct[]> {
  const q = query.trim().toLowerCase().slice(0, 100);
  if (!q) return [];
  const qNumber = Number((q.match(/\d+/) ?? [""])[0]) || null;
  const like = `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

  const fromDb = await listFromDb(
    (sql) => sql<ProductJoinRow[]>`
      select ${sql.unsafe(LIST_SELECT)}
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.is_published = true and (
        p.name_uk ilike ${like} or p.name_en ilike ${like} or b.name ilike ${like}
        or (${qNumber}::int is not null and (p.power_w = ${qNumber}::int or p.capacity_wh = ${qNumber}::int))
      )
      order by p.in_stock desc, p.is_bestseller desc, p.reviews_count desc
      limit ${limit}
    `,
    "search results"
  );
  if (fromDb) return fromDb;
  return demoAllProducts
    .filter(
      (p) =>
        p.name.uk.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (qNumber !== null && (p.powerW === qNumber || p.capacityWh === qNumber))
    )
    .slice(0, limit)
    .map(toListItem);
}

/** Lightweight products by id, in the order given (favorites page). Ids not
 *  in the database are looked up in the demo dataset. */
export async function getProductsByIds(ids: string[]): Promise<BaseProduct[]> {
  const wanted = Array.from(new Set(ids)).slice(0, 100);
  if (wanted.length === 0) return [];
  const fromDb =
    (await listFromDb(
      (sql) => sql<ProductJoinRow[]>`
        select ${sql.unsafe(LIST_SELECT)}
        from products p
        left join categories c on c.id = p.category_id
        left join brands b on b.id = p.brand_id
        where p.is_published = true and p.id::text = any(${wanted})
      `,
      "products by id"
    )) ?? [];
  const byId = new Map(fromDb.map((p) => [p.id, p]));
  for (const p of demoAllProducts) if (!byId.has(p.id) && wanted.includes(p.id)) byId.set(p.id, toListItem(p));
  return wanted.map((id) => byId.get(id)).filter((p): p is BaseProduct => Boolean(p));
}

/** Every published product URL for sitemap.xml. */
export async function getSitemapProducts(): Promise<{ category: CategorySlug; slug: string; updatedAt: Date }[]> {
  if (IS_DB_CONFIGURED) {
    const sql = getDb();
    if (sql) {
      try {
        const rows = await sql<{ category: string; slug: string; updated_at: Date }[]>`
          select c.slug as category, p.slug, p.updated_at
          from products p
          join categories c on c.id = p.category_id
          where p.is_published = true
        `;
        if (rows.length > 0) {
          return rows.map((r) => ({ category: r.category as CategorySlug, slug: r.slug, updatedAt: r.updated_at }));
        }
      } catch (err) {
        console.error("[catalog] failed to fetch sitemap products", err);
      }
    }
  }
  return demoAllProducts.map((p) => ({ category: p.category, slug: p.slug, updatedAt: new Date() }));
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
