import "server-only";
import { getDb, type Sql } from "@/lib/db/client";
import { describeDbError } from "@/lib/db/errors";
import { IS_DB_CONFIGURED } from "@/lib/env";
import type { NovaWarehouseType } from "@/lib/db/types";

/**
 * Importer for the local Nova Poshta directory — see
 * migrations/0010_nova_poshta_directory.sql for the tables this fills, and
 * src/lib/novaposhta.ts for how the storefront reads what this writes.
 *
 * Architecture: Nova Poshta API -> this importer (daily cron or manual
 * trigger, see src/app/api/cron/nova-poshta-sync/route.ts) -> nova_cities /
 * nova_warehouses / nova_warehouse_types -> backend API -> frontend. The
 * frontend and the checkout Route Handlers never call Nova Poshta directly.
 *
 * Deliberately does NOT import NOVA_POSHTA_API_KEY / IS_NOVA_POSHTA_CONFIGURED
 * from src/lib/env.ts — this whole file is intentionally decoupled from that
 * env var. Address.getCities, Address.getWarehouses and
 * Address.getWarehouseTypes are documented as not requiring an API key
 * ("Доступність: Не потребує використання API-ключа"), so every request below
 * sends `apiKey: ""` on purpose. If Nova Poshta ever starts requiring a key
 * for these specific methods, that's a deliberate architecture change to
 * make explicitly, not something to silently pull in NOVA_POSHTA_API_KEY for
 * — that env var is reserved for future authorized methods (cost
 * calculation, TTN creation, ...), which are out of scope here.
 */

const API_URL = "https://api.novaposhta.ua/v2.0/json/";

// Pause between paginated requests so a full sweep doesn't hammer Nova
// Poshta's API. "Reasonable" per the requirement — not configurable, not
// tuned against a rate-limit spec we don't have (none is documented for
// these unauthenticated methods), just a polite fixed delay.
const REQUEST_PAUSE_MS = 350;

// Nova Poshta's documented max page size for these two methods.
const CITIES_PAGE_LIMIT = 150;
const WAREHOUSES_PAGE_LIMIT = 500;

// Sanity caps so a bug in the "did the API return an empty page yet" check
// can never spin forever — Ukraine has on the order of ~30,000 settlements
// and ~20,000 branches/postomats total, so these caps leave generous room.
const CITIES_MAX_PAGES = 500;
const WAREHOUSES_MAX_PAGES = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NpApiResponse<T> {
  success?: boolean;
  data?: T[];
  errors?: string[];
  warnings?: string[];
}

async function callNovaPoshta<T>(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown> = {}
): Promise<T[]> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: "", // intentionally empty — see file header comment
      modelName,
      calledMethod,
      methodProperties,
    }),
  });

  if (!res.ok) {
    throw new Error(`nova-poshta http ${res.status} calling ${modelName}.${calledMethod}`);
  }

  const json = (await res.json()) as NpApiResponse<T>;
  if (json.success === false) {
    throw new Error(
      `nova-poshta api error calling ${modelName}.${calledMethod}: ${(json.errors ?? []).join("; ") || "unknown error"}`
    );
  }
  return json.data ?? [];
}

/** Async generator yielding one page (array of raw items) at a time, so
 *  callers can upsert page-by-page instead of holding the whole directory
 *  in memory. Stops on the first empty page or once maxPages is hit. */
async function* paginate<T>(
  modelName: string,
  calledMethod: string,
  extraProps: Record<string, unknown>,
  limit: number,
  maxPages: number
): AsyncGenerator<T[]> {
  for (let page = 1; page <= maxPages; page++) {
    const items = await callNovaPoshta<T>(modelName, calledMethod, {
      ...extraProps,
      // Nova Poshta's API rejects these as numbers ("Page is invalid
      // format") — despite the request body being JSON, it expects every
      // parameter value, numeric or not, sent as a string.
      Page: String(page),
      Limit: String(limit),
    });
    if (items.length === 0) return;
    yield items;
    if (items.length < limit) return; // short page = last page
    await sleep(REQUEST_PAUSE_MS);
  }
}

/** Raw shape of one Address.getWarehouseTypes row. */
interface RawWarehouseType {
  Ref: string;
  Description: string;
}

/** Raw shape of one Address.getCities row (fields we actually use — the API
 *  returns more, see the SDK reference noted in the migration/importer
 *  design notes). */
interface RawCity {
  Ref: string;
  Description: string;
  AreaDescription?: string;
  SettlementTypeDescription?: string;
}

/** Raw shape of one Address.getWarehouses row (fields we actually use). */
interface RawWarehouse {
  Ref: string;
  CityRef: string;
  Description: string;
  ShortAddress?: string;
  Number?: string;
  TypeOfWarehouse?: string;
  CategoryOfWarehouse?: string;
  Latitude?: string;
  Longitude?: string;
}

/** Resolves a raw warehouse-type description ("Відділення", "Поштомат",
 *  "Вантажне відділення", "Магазин", ...) to the app's small enum. This is
 *  the "determine type via getWarehouseTypes, no hardcoded GUID" piece:
 *  nothing here ever compares a TypeOfWarehouse Ref against a literal GUID
 *  string — it always goes through the description text fetched fresh from
 *  the API on every sync. */
function classifyWarehouseType(descriptionUk: string): NovaWarehouseType {
  const d = descriptionUk.toLowerCase();
  if (d.includes("поштомат")) return "poshtomat";
  if (d.includes("відділенн")) return "warehouse"; // covers "Відділення" and "Вантажне відділення"
  return "other";
}

export interface NovaPoshtaSyncSummary {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  warehouseTypesImported: number;
  citiesUpserted: number;
  citiesDeactivated: number;
  warehousesUpserted: number;
  warehousesDeactivated: number;
  error?: string;
}

async function importWarehouseTypes(sql: Sql): Promise<Map<string, NovaWarehouseType>> {
  const types = await callNovaPoshta<RawWarehouseType>("Address", "getWarehouseTypes");
  const typeByRef = new Map<string, NovaWarehouseType>();

  for (const t of types) {
    if (!t.Ref || !t.Description) continue;
    typeByRef.set(t.Ref, classifyWarehouseType(t.Description));
    await sql`
      insert into nova_warehouse_types (ref, description_uk, updated_at)
      values (${t.Ref}, ${t.Description}, now())
      on conflict (ref) do update set
        description_uk = excluded.description_uk,
        updated_at = now()
    `;
  }

  return typeByRef;
}

async function importCities(sql: Sql, syncStartedAt: string): Promise<{ upserted: number; deactivated: number }> {
  let upserted = 0;

  for await (const page of paginate<RawCity>("Address", "getCities", {}, CITIES_PAGE_LIMIT, CITIES_MAX_PAGES)) {
    for (const c of page) {
      if (!c.Ref || !c.Description) continue;
      await sql`
        insert into nova_cities (ref, name_uk, area, settlement_type, is_active, updated_at)
        values (${c.Ref}, ${c.Description}, ${c.AreaDescription ?? ""}, ${c.SettlementTypeDescription ?? ""}, true, now())
        on conflict (ref) do update set
          name_uk = excluded.name_uk,
          area = excluded.area,
          settlement_type = excluded.settlement_type,
          is_active = true,
          updated_at = now()
      `;
      upserted += 1;
    }
  }

  // Anything not touched by this sweep (updated_at still older than when the
  // sweep started) is no longer returned by Nova Poshta — mark it inactive
  // rather than deleting it, so historical orders that reference an old
  // city_ref still resolve.
  const deactivated = await sql`
    update nova_cities set is_active = false
    where is_active = true and updated_at < ${syncStartedAt}
  `;

  return { upserted, deactivated: deactivated.count };
}

async function importWarehouses(
  sql: Sql,
  syncStartedAt: string,
  typeByRef: Map<string, NovaWarehouseType>
): Promise<{ upserted: number; deactivated: number }> {
  let upserted = 0;

  // No CityRef filter — this pulls every branch/postomat in Ukraine, one
  // paginated sweep, rather than looping per-city (which would mean tens of
  // thousands of extra requests).
  for await (const page of paginate<RawWarehouse>("Address", "getWarehouses", {}, WAREHOUSES_PAGE_LIMIT, WAREHOUSES_MAX_PAGES)) {
    for (const w of page) {
      if (!w.Ref || !w.CityRef) continue;
      const resolvedType = (w.TypeOfWarehouse && typeByRef.get(w.TypeOfWarehouse)) || "other";
      const lat = w.Latitude ? Number(w.Latitude) : null;
      const lon = w.Longitude ? Number(w.Longitude) : null;

      await sql`
        insert into nova_warehouses (
          ref, city_ref, name, short_address, number,
          warehouse_type_ref, category, type, latitude, longitude, is_active, updated_at
        ) values (
          ${w.Ref}, ${w.CityRef}, ${w.Description ?? ""}, ${w.ShortAddress ?? ""}, ${w.Number ?? ""},
          ${w.TypeOfWarehouse ?? ""}, ${w.CategoryOfWarehouse ?? ""}, ${resolvedType},
          ${Number.isFinite(lat) ? lat : null}, ${Number.isFinite(lon) ? lon : null}, true, now()
        )
        on conflict (ref) do update set
          city_ref = excluded.city_ref,
          name = excluded.name,
          short_address = excluded.short_address,
          number = excluded.number,
          warehouse_type_ref = excluded.warehouse_type_ref,
          category = excluded.category,
          type = excluded.type,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          is_active = true,
          updated_at = now()
      `;
      upserted += 1;
    }
    await sleep(REQUEST_PAUSE_MS);
  }

  const deactivated = await sql`
    update nova_warehouses set is_active = false
    where is_active = true and updated_at < ${syncStartedAt}
  `;

  return { upserted, deactivated: deactivated.count };
}

/** Runs one full sync: warehouse types, then all cities, then all
 *  warehouses/postomats. Writes its own summary into settings under
 *  'nova_poshta_sync_status' (readable by the admin panel later if wanted),
 *  and always returns the summary too so the cron/manual-trigger route can
 *  return it directly in the response body. */
export async function runNovaPoshtaSync(): Promise<NovaPoshtaSyncSummary> {
  const startedAt = new Date().toISOString();

  if (!IS_DB_CONFIGURED) {
    const finishedAt = new Date().toISOString();
    return {
      ok: false,
      startedAt,
      finishedAt,
      durationMs: 0,
      warehouseTypesImported: 0,
      citiesUpserted: 0,
      citiesDeactivated: 0,
      warehousesUpserted: 0,
      warehousesDeactivated: 0,
      error: "db_not_configured",
    };
  }

  const sql = getDb();
  if (!sql) {
    const finishedAt = new Date().toISOString();
    return {
      ok: false,
      startedAt,
      finishedAt,
      durationMs: 0,
      warehouseTypesImported: 0,
      citiesUpserted: 0,
      citiesDeactivated: 0,
      warehousesUpserted: 0,
      warehousesDeactivated: 0,
      error: "db_not_configured",
    };
  }

  let summary: NovaPoshtaSyncSummary;

  try {
    const typeByRef = await importWarehouseTypes(sql);
    const cityResult = await importCities(sql, startedAt);
    const warehouseResult = await importWarehouses(sql, startedAt, typeByRef);

    const finishedAt = new Date().toISOString();
    summary = {
      ok: true,
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      warehouseTypesImported: typeByRef.size,
      citiesUpserted: cityResult.upserted,
      citiesDeactivated: cityResult.deactivated,
      warehousesUpserted: warehouseResult.upserted,
      warehousesDeactivated: warehouseResult.deactivated,
    };
  } catch (err) {
    console.error("[nova-poshta-import] sync failed", describeDbError(err), err);
    const finishedAt = new Date().toISOString();
    summary = {
      ok: false,
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      warehouseTypesImported: 0,
      citiesUpserted: 0,
      citiesDeactivated: 0,
      warehousesUpserted: 0,
      warehousesDeactivated: 0,
      error: err instanceof Error ? err.message : "unknown_error",
    };
  }

  try {
    await sql`
      insert into settings (key, value, updated_at)
      values ('nova_poshta_sync_status', ${JSON.stringify(summary)}::jsonb, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `;
  } catch (err) {
    console.error("[nova-poshta-import] failed to persist sync status", describeDbError(err), err);
  }

  return summary;
}
