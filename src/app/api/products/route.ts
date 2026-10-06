import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/catalog";

/**
 * GET /api/products?ids=<id>,<id>,...
 * Lightweight products by id, in the requested order — used by the
 * favorites page, whose ids live in the visitor's browser. At most 100 ids;
 * unknown or unpublished ids are simply left out.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 100)
    .slice(0, 100);
  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
