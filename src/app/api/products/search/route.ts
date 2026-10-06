import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog";

/**
 * GET /api/products/search?q=...
 * Header search: up to 6 lightweight products whose name or brand contains
 * `q`, or whose power / capacity equals the number in `q` ("2000", "1024 wh").
 * Reads the database (falls back to the demo set when it isn't configured).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 100);
  const products = q.trim() ? await searchProducts(q) : [];
  return NextResponse.json({ products });
}
