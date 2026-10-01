import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { isSafeImageFilename, resolveProductImagePath, contentTypeForFilename } from "@/lib/storage/local";

/**
 * Public (unauthenticated) GET route that serves locally-stored product
 * photos. This is the "safe URL" the frontend uses instead of a raw
 * filesystem path or direct disk access — see src/lib/storage/local.ts for
 * the write/delete side and the security rationale. There is intentionally
 * no auth check here: these are storefront-public product photos, exactly
 * as public as the old Supabase Storage public bucket URLs were. Auth is
 * still required to POST/DELETE (see /api/admin/upload).
 *
 * Filenames are content-addressed random UUIDs, so a long-lived immutable
 * Cache-Control is safe: a given filename's bytes never change, a new
 * upload always gets a new filename, and a delete simply makes the URL
 * 404 from then on.
 */
export async function GET(_request: Request, { params }: { params: { filename: string } }) {
  const { filename } = params;

  if (!isSafeImageFilename(filename)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const filePath = resolveProductImagePath(filename);
  if (!filePath) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const contentType = contentTypeForFilename(filename) ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
