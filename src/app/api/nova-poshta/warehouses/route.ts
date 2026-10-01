import { NextResponse } from "next/server";
import { getNovaWarehousesByCity } from "@/lib/novaposhta";
import type { NovaWarehouseType } from "@/lib/db/types";

const VALID_TYPES = new Set<NovaWarehouseType>(["warehouse", "poshtomat", "other"]);

/**
 * GET /api/nova-poshta/warehouses?cityRef=...&type=warehouse|poshtomat
 * Reads from the local directory (nova_warehouses), scoped to one city —
 * never the whole directory. `type` is optional; when passed, only that
 * subset is returned, so the frontend never has to filter a bigger list
 * client-side.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityRef = searchParams.get("cityRef") ?? "";
  if (!cityRef) return NextResponse.json({ warehouses: [] });

  const typeParam = searchParams.get("type");
  const type = typeParam && VALID_TYPES.has(typeParam as NovaWarehouseType) ? (typeParam as NovaWarehouseType) : undefined;

  const warehouses = await getNovaWarehousesByCity(cityRef, type);
  return NextResponse.json({ warehouses });
}
