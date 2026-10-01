import { NextResponse } from "next/server";
import { searchNovaCities } from "@/lib/novaposhta";

/**
 * GET /api/nova-poshta/cities?q=...
 * Reads from the local directory (nova_cities), never from Nova Poshta
 * directly — see src/lib/novaposhta.ts. With no `q`, returns a default,
 * immediately-usable listing so the checkout page's city field can show a
 * list the moment it's focused, with no typing required.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const cities = await searchNovaCities(q);
  return NextResponse.json({ cities });
}
