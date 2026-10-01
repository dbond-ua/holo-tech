import "server-only";
import type { Sql } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { describeDbError } from "@/lib/db/errors";
import type { ProductRow, CategoryRow, BrandRow, StockAdjustmentRow } from "@/lib/db/types";
import { computeStockStatus } from "@/lib/stock";

export interface ProductWithRelations extends ProductRow {
  category?: CategoryRow | null;
  brand?: BrandRow | null;
}

type ProductJoinRow = ProductRow & { category: CategoryRow | null; brand: BrandRow | null };

export async function listProducts(): Promise<ProductWithRelations[]> {
  if (!IS_DB_CONFIGURED) return [];
  const sql = getDb();
  if (!sql) return [];
  try {
    return await sql<ProductJoinRow[]>`
      select p.*, to_jsonb(c) as category, to_jsonb(b) as brand
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      order by p.created_at desc
    `;
  } catch (err) {
    console.error("[admin/products] listProducts failed", describeDbError(err), err);
    return [];
  }
}

export async function getProduct(id: string): Promise<ProductWithRelations | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;
  try {
    const [row] = await sql<ProductJoinRow[]>`
      select p.*, to_jsonb(c) as category, to_jsonb(b) as brand
      from products p
      left join categories c on c.id = p.category_id
      left join brands b on b.id = p.brand_id
      where p.id = ${id}
    `;
    return row ?? null;
  } catch (err) {
    console.error("[admin/products] getProduct failed", describeDbError(err), err);
    return null;
  }
}

/**
 * Inserts a new product. Written as one fully-explicit, hand-cast SQL
 * statement (every column named, no dynamic object-to-column mapping)
 * because the admin form (see parseProductForm in
 * src/app/(admin)/admin/actions.ts) always submits a fully-populated
 * object, never a sparse partial — so there is no need for conditional
 * column lists here. `extra_specs` gets an explicit ::jsonb cast and the
 * text-array fields get an explicit ::text[] cast, since an empty JS array
 * has no type information of its own for the driver to infer from.
 * Columns the form doesn't set (seo_*, currency, stock_reserved,
 * gallery_frame_count, rating, reviews_count) are left out entirely and
 * take their table defaults.
 */
export async function createProduct(input: Partial<ProductRow>): Promise<{ id: string } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };

  try {
    const [row] = await sql<{ id: string }[]>`
      insert into products (
        slug, category_id, brand_id, name_uk, name_en, tagline_uk, tagline_en,
        description_uk, description_en, whats_included_uk, whats_included_en,
        features_uk, features_en, price, old_price, in_stock, stock_count,
        is_new, is_bestseller, is_demo, expandable, high_voltage,
        power_w, capacity_wh, outlets, charge_time_h, battery_type, fast_charge,
        is_lifepo4, has_ups, solar_charging, bluetooth, wifi, weight_kg,
        phase, mppt, inverter_type, voltage_v, capacity_ah, max_current_a, cycles,
        extra_specs, images, show_on_homepage, homepage_sort_order, is_published
      ) values (
        ${input.slug ?? null}, ${input.category_id ?? null}, ${input.brand_id ?? null},
        ${input.name_uk ?? ""}, ${input.name_en ?? ""}, ${input.tagline_uk ?? ""}, ${input.tagline_en ?? ""},
        ${input.description_uk ?? ""}, ${input.description_en ?? ""},
        ${input.whats_included_uk ?? []}::text[], ${input.whats_included_en ?? []}::text[],
        ${input.features_uk ?? []}::text[], ${input.features_en ?? []}::text[],
        ${input.price ?? 0}, ${input.old_price ?? null}, ${input.in_stock ?? true}, ${input.stock_count ?? null},
        ${input.is_new ?? false}, ${input.is_bestseller ?? false}, ${input.is_demo ?? false},
        ${input.expandable ?? false}, ${input.high_voltage ?? false},
        ${input.power_w ?? null}, ${input.capacity_wh ?? null}, ${input.outlets ?? null},
        ${input.charge_time_h ?? null}, ${input.battery_type ?? null}, ${input.fast_charge ?? null},
        ${input.is_lifepo4 ?? null}, ${input.has_ups ?? null}, ${input.solar_charging ?? null},
        ${input.bluetooth ?? null}, ${input.wifi ?? null}, ${input.weight_kg ?? null},
        ${input.phase ?? null}, ${input.mppt ?? null}, ${input.inverter_type ?? null},
        ${input.voltage_v ?? null}, ${input.capacity_ah ?? null}, ${input.max_current_a ?? null}, ${input.cycles ?? null},
        ${JSON.stringify(input.extra_specs ?? [])}::jsonb, ${input.images ?? []}::text[],
        ${input.show_on_homepage ?? false}, ${input.homepage_sort_order ?? 0}, ${input.is_published ?? true}
      )
      returning id
    `;
    return { id: row.id };
  } catch (err) {
    console.error("[admin/products] createProduct failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}

/**
 * Updates a product. `stock_count` is special-cased: instead of a plain
 * column write, the change is routed through the same atomic adjust_stock()
 * SQL function the order flow uses (see src/lib/orders.ts) so a manual edit
 * made here is logged to stock_adjustments (reason "manual") alongside
 * order-driven reserve/confirm/release changes, and can never race a
 * concurrent order reservation. Clearing the field back to empty (null) is
 * "stop tracking this product's stock", not a quantity change, so that case
 * still goes through a plain column write with no adjustment logged.
 *
 * Every other column is written via one explicit, fully-named UPDATE
 * statement built from a fixed, hand-written list of `column = value`
 * fragments — only columns actually present (!== undefined) in `input` are
 * included, so a field the caller didn't touch is never overwritten with
 * null. This is plain nested-template-literal composition (a documented,
 * basic postgres.js feature), not the library's dynamic object-to-row
 * insert/update helper.
 */
export async function updateProduct(
  id: string,
  input: Partial<ProductRow>,
  opts?: { managerId?: string | null; managerName?: string | null }
): Promise<{ ok: true } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };

  const rest: Partial<ProductRow> = { ...input };
  if ("stock_count" in rest) {
    const nextStockCount = rest.stock_count;
    delete rest.stock_count;

    if (typeof nextStockCount === "number") {
      try {
        const [current] = await sql<{ stock_count: number | null }[]>`
          select stock_count from products where id = ${id}
        `;
        const currentCount = current?.stock_count ?? 0;
        const delta = nextStockCount - currentCount;
        if (delta !== 0) {
          await sql`
            select * from adjust_stock(
              ${id}, ${delta}, 0, 'manual', null, ${opts?.managerId ?? null}, ${opts?.managerName ?? null}, null
            )
          `;
        }
      } catch (err) {
        console.error("[admin/products] adjust_stock (manual) failed", describeDbError(err), err);
        return { error: describeDbError(err).message };
      }
    } else {
      // Explicitly clearing the field — switch the product to "untracked".
      rest.stock_count = null;
    }
  }

  const fragments = buildProductAssignments(sql, rest);
  if (fragments.length === 0) return { ok: true };

  let setClause = fragments[0];
  for (let i = 1; i < fragments.length; i++) setClause = sql`${setClause}, ${fragments[i]}`;

  try {
    await sql`update products set ${setClause} where id = ${id}`;
    return { ok: true };
  } catch (err) {
    console.error("[admin/products] updateProduct failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}

/** Every product column parseProductForm can send, each hard-coded to its
 *  own `column = value` fragment (with the right cast where it matters) so
 *  the dynamic SET clause above never has to guess a column's type. Only
 *  fragments for keys actually present in `rest` are returned. */
function buildProductAssignments(sql: Sql, rest: Partial<ProductRow>) {
  // Typed `any` deliberately: postgres.js's tagged-template call signature is
  // generic, and TypeScript infers a slightly different row-type parameter
  // for each individual `sql\`...\`` call above — so an array typed via
  // `ReturnType<typeof sql>` (which fixes one particular instantiation)
  // rejects fragments produced by the others as "not assignable", even
  // though they're structurally identical PendingQuery objects at runtime.
  // These fragments are only ever concatenated back into another `sql`
  // tagged template (never read directly), so `any` here is safe.
  const fragments: any[] = [];
  const push = (cond: boolean, fragment: any) => {
    if (cond) fragments.push(fragment);
  };

  push(rest.slug !== undefined, sql`slug = ${rest.slug ?? null}`);
  push(rest.category_id !== undefined, sql`category_id = ${rest.category_id ?? null}`);
  push(rest.brand_id !== undefined, sql`brand_id = ${rest.brand_id ?? null}`);
  push(rest.name_uk !== undefined, sql`name_uk = ${rest.name_uk ?? ""}`);
  push(rest.name_en !== undefined, sql`name_en = ${rest.name_en ?? ""}`);
  push(rest.tagline_uk !== undefined, sql`tagline_uk = ${rest.tagline_uk ?? ""}`);
  push(rest.tagline_en !== undefined, sql`tagline_en = ${rest.tagline_en ?? ""}`);
  push(rest.description_uk !== undefined, sql`description_uk = ${rest.description_uk ?? ""}`);
  push(rest.description_en !== undefined, sql`description_en = ${rest.description_en ?? ""}`);
  push(rest.whats_included_uk !== undefined, sql`whats_included_uk = ${rest.whats_included_uk ?? []}::text[]`);
  push(rest.whats_included_en !== undefined, sql`whats_included_en = ${rest.whats_included_en ?? []}::text[]`);
  push(rest.features_uk !== undefined, sql`features_uk = ${rest.features_uk ?? []}::text[]`);
  push(rest.features_en !== undefined, sql`features_en = ${rest.features_en ?? []}::text[]`);
  push(rest.price !== undefined, sql`price = ${rest.price ?? 0}`);
  push(rest.old_price !== undefined, sql`old_price = ${rest.old_price ?? null}`);
  push(rest.in_stock !== undefined, sql`in_stock = ${rest.in_stock ?? true}`);
  push(rest.is_new !== undefined, sql`is_new = ${rest.is_new ?? false}`);
  push(rest.is_bestseller !== undefined, sql`is_bestseller = ${rest.is_bestseller ?? false}`);
  push(rest.is_demo !== undefined, sql`is_demo = ${rest.is_demo ?? false}`);
  push(rest.expandable !== undefined, sql`expandable = ${rest.expandable ?? false}`);
  push(rest.high_voltage !== undefined, sql`high_voltage = ${rest.high_voltage ?? false}`);
  push(rest.power_w !== undefined, sql`power_w = ${rest.power_w ?? null}`);
  push(rest.capacity_wh !== undefined, sql`capacity_wh = ${rest.capacity_wh ?? null}`);
  push(rest.outlets !== undefined, sql`outlets = ${rest.outlets ?? null}`);
  push(rest.charge_time_h !== undefined, sql`charge_time_h = ${rest.charge_time_h ?? null}`);
  push(rest.battery_type !== undefined, sql`battery_type = ${rest.battery_type ?? null}`);
  push(rest.fast_charge !== undefined, sql`fast_charge = ${rest.fast_charge ?? null}`);
  push(rest.is_lifepo4 !== undefined, sql`is_lifepo4 = ${rest.is_lifepo4 ?? null}`);
  push(rest.has_ups !== undefined, sql`has_ups = ${rest.has_ups ?? null}`);
  push(rest.solar_charging !== undefined, sql`solar_charging = ${rest.solar_charging ?? null}`);
  push(rest.bluetooth !== undefined, sql`bluetooth = ${rest.bluetooth ?? null}`);
  push(rest.wifi !== undefined, sql`wifi = ${rest.wifi ?? null}`);
  push(rest.weight_kg !== undefined, sql`weight_kg = ${rest.weight_kg ?? null}`);
  push(rest.phase !== undefined, sql`phase = ${rest.phase ?? null}`);
  push(rest.mppt !== undefined, sql`mppt = ${rest.mppt ?? null}`);
  push(rest.inverter_type !== undefined, sql`inverter_type = ${rest.inverter_type ?? null}`);
  push(rest.voltage_v !== undefined, sql`voltage_v = ${rest.voltage_v ?? null}`);
  push(rest.capacity_ah !== undefined, sql`capacity_ah = ${rest.capacity_ah ?? null}`);
  push(rest.max_current_a !== undefined, sql`max_current_a = ${rest.max_current_a ?? null}`);
  push(rest.cycles !== undefined, sql`cycles = ${rest.cycles ?? null}`);
  push(rest.extra_specs !== undefined, sql`extra_specs = ${JSON.stringify(rest.extra_specs ?? [])}::jsonb`);
  push(rest.images !== undefined, sql`images = ${rest.images ?? []}::text[]`);
  push(rest.show_on_homepage !== undefined, sql`show_on_homepage = ${rest.show_on_homepage ?? false}`);
  push(rest.homepage_sort_order !== undefined, sql`homepage_sort_order = ${rest.homepage_sort_order ?? 0}`);
  push(rest.is_published !== undefined, sql`is_published = ${rest.is_published ?? true}`);
  // stock_count only ever reaches here as an explicit null (see above) —
  // "stop tracking" — never as a number (numbers go through adjust_stock).
  push(rest.stock_count === null, sql`stock_count = null`);

  return fragments;
}

/** Recent stock_adjustments rows for a product, newest first — the
 *  admin-panel history view (task: "stock change history"). */
export async function listStockAdjustments(productId: string, limit = 25): Promise<StockAdjustmentRow[]> {
  if (!IS_DB_CONFIGURED) return [];
  const sql = getDb();
  if (!sql) return [];
  try {
    return await sql<StockAdjustmentRow[]>`
      select * from stock_adjustments
      where product_id = ${productId}
      order by created_at desc
      limit ${limit}
    `;
  } catch (err) {
    console.error("[admin/products] listStockAdjustments failed", describeDbError(err), err);
    return [];
  }
}

export interface ProductStockSummary {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

/** Powers the admin dashboard's "Товари" summary widget. Products without
 *  stock tracking enabled (stock_count === null) fall back to the manual
 *  in_stock flag, same as the storefront does. */
export async function countProductsByStockStatus(): Promise<ProductStockSummary> {
  const summary: ProductStockSummary = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
  if (!IS_DB_CONFIGURED) return summary;
  const sql = getDb();
  if (!sql) return summary;

  try {
    const rows = await sql<
      Pick<ProductRow, "in_stock" | "stock_count" | "stock_reserved" | "low_stock_threshold">[]
    >`select in_stock, stock_count, stock_reserved, low_stock_threshold from products`;

    summary.total = rows.length;
    for (const row of rows) {
      const status = computeStockStatus(
        { stockCount: row.stock_count, stockReserved: row.stock_reserved },
        row.low_stock_threshold ?? undefined
      );
      if (status === null) {
        if (row.in_stock) summary.inStock += 1;
        else summary.outOfStock += 1;
      } else if (status === "in_stock") summary.inStock += 1;
      else if (status === "low_stock") summary.lowStock += 1;
      else summary.outOfStock += 1;
    }
  } catch (err) {
    console.error("[admin/products] countProductsByStockStatus failed", describeDbError(err), err);
  }
  return summary;
}

/** Quick publish/hide toggle for the products list — no need to open the
 *  full edit form just to hide a product. */
export async function setProductPublished(id: string, isPublished: boolean): Promise<{ ok: true } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };
  try {
    await sql`update products set is_published = ${isPublished} where id = ${id}`;
    return { ok: true };
  } catch (err) {
    console.error("[admin/products] setProductPublished failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}

export async function deleteProduct(id: string): Promise<{ ok: true } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };
  try {
    await sql`delete from products where id = ${id}`;
    return { ok: true };
  } catch (err) {
    console.error("[admin/products] deleteProduct failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}

export async function listCategories(): Promise<CategoryRow[]> {
  if (!IS_DB_CONFIGURED) return [];
  const sql = getDb();
  if (!sql) return [];
  try {
    return await sql<CategoryRow[]>`select * from categories order by sort_order`;
  } catch (err) {
    console.error("[admin/products] listCategories failed", describeDbError(err), err);
    return [];
  }
}

export async function updateCategory(id: string, input: Partial<CategoryRow>): Promise<{ ok: true } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };

  // See the matching comment in buildProductAssignments() above for why
  // this is `any[]` rather than `ReturnType<typeof sql>[]`.
  const fragments: any[] = [];
  const push = (cond: boolean, fragment: any) => {
    if (cond) fragments.push(fragment);
  };
  // `?? ""` / `?? 0` below are inert at runtime — push() only adds the
  // fragment when the `!== undefined` guard is true, so the real value is
  // always used. They exist only so TypeScript sees a concrete `string`/
  // `number` instead of `string | undefined`: passing a possibly-undefined
  // value straight into a `sql` tagged template makes its overload
  // resolution fall back to a `never` row type, which then rejects every
  // parameter ("No overload matches this call"). Same convention already
  // used in buildProductAssignments() above.
  push(input.title_uk !== undefined, sql`title_uk = ${input.title_uk ?? ""}`);
  push(input.title_en !== undefined, sql`title_en = ${input.title_en ?? ""}`);
  push(input.short_title_uk !== undefined, sql`short_title_uk = ${input.short_title_uk ?? ""}`);
  push(input.short_title_en !== undefined, sql`short_title_en = ${input.short_title_en ?? ""}`);
  push(input.description_uk !== undefined, sql`description_uk = ${input.description_uk ?? ""}`);
  push(input.description_en !== undefined, sql`description_en = ${input.description_en ?? ""}`);
  push(input.emoji !== undefined, sql`emoji = ${input.emoji ?? ""}`);
  push(input.sort_order !== undefined, sql`sort_order = ${input.sort_order ?? 0}`);

  if (fragments.length === 0) return { ok: true };
  let setClause = fragments[0];
  for (let i = 1; i < fragments.length; i++) setClause = sql`${setClause}, ${fragments[i]}`;

  try {
    await sql`update categories set ${setClause} where id = ${id}`;
    return { ok: true };
  } catch (err) {
    console.error("[admin/products] updateCategory failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}

export async function listBrands(): Promise<BrandRow[]> {
  if (!IS_DB_CONFIGURED) return [];
  const sql = getDb();
  if (!sql) return [];
  try {
    return await sql<BrandRow[]>`select * from brands order by sort_order`;
  } catch (err) {
    console.error("[admin/products] listBrands failed", describeDbError(err), err);
    return [];
  }
}

export async function createBrand(name: string): Promise<{ id: string } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };
  try {
    const [row] = await sql<{ id: string }[]>`insert into brands (name) values (${name}) returning id`;
    return { id: row.id };
  } catch (err) {
    console.error("[admin/products] createBrand failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}

export async function deleteBrand(id: string): Promise<{ ok: true } | { error: string }> {
  if (!IS_DB_CONFIGURED) return { error: "db_not_configured" };
  const sql = getDb();
  if (!sql) return { error: "db_not_configured" };
  try {
    await sql`delete from brands where id = ${id}`;
    return { ok: true };
  } catch (err) {
    console.error("[admin/products] deleteBrand failed", describeDbError(err), err);
    return { error: describeDbError(err).message };
  }
}
