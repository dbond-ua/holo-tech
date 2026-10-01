import "server-only";
import { getDb } from "@/lib/db/client";
import { describeDbError } from "@/lib/db/errors";
import { IS_DB_CONFIGURED } from "@/lib/env";
import type { NovaCityRow, NovaWarehouseRow, NovaWarehouseType } from "@/lib/db/types";

/**
 * Storefront-facing reads of the local Nova Poshta directory.
 *
 * This file NEVER calls the Nova Poshta API and never touches
 * NOVA_POSHTA_API_KEY / IS_NOVA_POSHTA_CONFIGURED — by design. The only code
 * that talks to Nova Poshta is src/lib/novaposhta-import.ts, run on a
 * schedule (see src/app/api/cron/nova-poshta-sync/route.ts). Everything here
 * just reads nova_cities / nova_warehouses in Postgres, which that importer
 * keeps fresh — see migrations/0010_nova_poshta_directory.sql.
 *
 * Architecture: Nova Poshta API -> daily importer -> nova_cities /
 * nova_warehouses (Postgres) -> this file -> /api/nova-poshta/* routes ->
 * checkout form.
 */

export interface NpCity {
  ref: string;
  name: string;
  area: string;
  settlementType: string;
}

export interface NpWarehouse {
  ref: string;
  name: string;
  shortAddress: string;
  number: string;
  type: NovaWarehouseType;
}

/** A handful of major Ukrainian cities with a couple of demo branches each —
 *  used only when the database isn't configured at all, or hasn't been
 *  synced yet (empty tables), so the checkout flow's city/branch selects are
 *  always usable, e.g. right after a fresh deploy before the first import
 *  has run. Once nova_cities has real rows, this data is never shown. */
const DEMO_CITIES: NpCity[] = [
  { ref: "demo-kyiv", name: "Київ", area: "Київська область", settlementType: "Місто" },
  { ref: "demo-lviv", name: "Львів", area: "Львівська область", settlementType: "Місто" },
  { ref: "demo-odesa", name: "Одеса", area: "Одеська область", settlementType: "Місто" },
  { ref: "demo-kharkiv", name: "Харків", area: "Харківська область", settlementType: "Місто" },
  { ref: "demo-dnipro", name: "Дніпро", area: "Дніпропетровська область", settlementType: "Місто" },
];

const DEMO_WAREHOUSES: Record<string, NpWarehouse[]> = {
  "demo-kyiv": [
    { ref: "demo-kyiv-w1", name: "Відділення №1: вул. Хрещатик, 22", shortAddress: "вул. Хрещатик, 22", number: "1", type: "warehouse" },
    { ref: "demo-kyiv-w2", name: "Відділення №22: просп. Перемоги, 67", shortAddress: "просп. Перемоги, 67", number: "22", type: "warehouse" },
    { ref: "demo-kyiv-p1", name: "Поштомат №3009: вул. Antonovycha, 5", shortAddress: "вул. Antonovycha, 5", number: "3009", type: "poshtomat" },
  ],
  "demo-lviv": [
    { ref: "demo-lviv-w1", name: "Відділення №1: вул. Городоцька, 359", shortAddress: "вул. Городоцька, 359", number: "1", type: "warehouse" },
    { ref: "demo-lviv-p1", name: "Поштомат №2041: просп. Свободи, 14", shortAddress: "просп. Свободи, 14", number: "2041", type: "poshtomat" },
  ],
  "demo-odesa": [
    { ref: "demo-odesa-w1", name: "Відділення №1: вул. Дерибасівська, 5", shortAddress: "вул. Дерибасівська, 5", number: "1", type: "warehouse" },
  ],
  "demo-kharkiv": [
    { ref: "demo-kharkiv-w1", name: "Відділення №1: вул. Сумська, 10", shortAddress: "вул. Сумська, 10", number: "1", type: "warehouse" },
  ],
  "demo-dnipro": [
    { ref: "demo-dnipro-w1", name: "Відділення №1: просп. Дмитра Яворницького, 50", shortAddress: "просп. Дмитра Яворницького, 50", number: "1", type: "warehouse" },
  ],
};

function cityRowToNpCity(row: NovaCityRow): NpCity {
  return { ref: row.ref, name: row.name_uk, area: row.area, settlementType: row.settlement_type };
}

function warehouseRowToNpWarehouse(row: NovaWarehouseRow): NpWarehouse {
  return {
    ref: row.ref,
    name: row.name,
    shortAddress: row.short_address,
    number: row.number,
    type: row.type,
  };
}

/**
 * Returns cities for the "Місто" combobox.
 *  - No query (or blank): a default, immediately-usable listing — cities
 *    first, then other settlement types, alphabetically — so the field can
 *    show a list the instant it's focused, with no typing required. Nova
 *    Poshta's API has no population/importance field, so this ordering is
 *    the most honest "default" available (no fabricated ranking).
 *  - With a query: substring search over the Ukrainian name (case- and
 *    typo-tolerant via the pg_trgm index from migration 0010).
 * Limited to 30 results either way — the frontend only ever gets the bounded
 * set it can actually show in the dropdown, never the full directory.
 */
export async function searchNovaCities(query: string): Promise<NpCity[]> {
  const q = query.trim();

  if (!IS_DB_CONFIGURED) {
    if (!q) return DEMO_CITIES;
    return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }

  const sql = getDb();
  if (!sql) {
    if (!q) return DEMO_CITIES;
    return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }

  try {
    let rows: NovaCityRow[];
    if (!q) {
      rows = await sql<NovaCityRow[]>`
        select * from nova_cities
        where is_active = true
        order by (settlement_type = 'Місто') desc, name_uk asc
        limit 30
      `;
      // Real DB configured but nothing imported yet (fresh deploy, import
      // hasn't run) — fall back to demo data rather than showing an empty
      // "no cities" list on a page that just loaded.
      if (rows.length === 0) return DEMO_CITIES;
    } else {
      rows = await sql<NovaCityRow[]>`
        select * from nova_cities
        where is_active = true and name_uk ilike ${"%" + q + "%"}
        order by similarity(name_uk, ${q}) desc, name_uk asc
        limit 30
      `;
    }
    return rows.map(cityRowToNpCity);
  } catch (err) {
    console.error("[nova-poshta] searchNovaCities failed, falling back to demo data", describeDbError(err), err);
    if (!q) return DEMO_CITIES;
    return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }
}

/**
 * Returns branches/postomats for one city, optionally narrowed to a single
 * `type` ("warehouse" | "poshtomat") — the checkout form passes `type` so
 * the backend returns only what that tab needs, not the whole city's list
 * filtered client-side.
 */
export async function getNovaWarehousesByCity(cityRef: string, type?: NovaWarehouseType): Promise<NpWarehouse[]> {
  if (cityRef in DEMO_WAREHOUSES) {
    const list = DEMO_WAREHOUSES[cityRef] ?? [];
    return type ? list.filter((w) => w.type === type) : list;
  }

  if (!IS_DB_CONFIGURED) return [];
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = type
      ? await sql<NovaWarehouseRow[]>`
          select * from nova_warehouses
          where city_ref = ${cityRef} and is_active = true and type = ${type}
          order by number asc, name asc
        `
      : await sql<NovaWarehouseRow[]>`
          select * from nova_warehouses
          where city_ref = ${cityRef} and is_active = true
          order by number asc, name asc
        `;
    return rows.map(warehouseRowToNpWarehouse);
  } catch (err) {
    console.error("[nova-poshta] getNovaWarehousesByCity failed", describeDbError(err), err);
    return [];
  }
}
