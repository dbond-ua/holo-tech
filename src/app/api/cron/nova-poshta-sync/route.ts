import { NextResponse } from "next/server";
import { CRON_SECRET } from "@/lib/env";
import { runNovaPoshtaSync } from "@/lib/novaposhta-import";

/**
 * Runs one full Nova Poshta directory sync (warehouse types -> cities ->
 * warehouses/postomats, see src/lib/novaposhta-import.ts) and writes the
 * result into nova_cities / nova_warehouses / nova_warehouse_types.
 *
 * Same route serves three purposes, all deliberately sharing one code path
 * rather than three separate scripts:
 *  - the daily scheduled sync (point a system cron job / external scheduler
 *    at this URL once a day)
 *  - the very first import after deploying this feature
 *  - a manual re-sync whenever you want fresher data immediately
 *
 * GET /api/cron/nova-poshta-sync?secret=<CRON_SECRET>
 *
 * Follows the same secret-gate pattern as /api/cron/reminders. If
 * CRON_SECRET isn't set, the route is unprotected — set CRON_SECRET in
 * production before relying on this endpoint.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (CRON_SECRET && searchParams.get("secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await runNovaPoshtaSync();
  return NextResponse.json(summary, { status: summary.ok ? 200 : 500 });
}
