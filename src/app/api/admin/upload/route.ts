import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { saveProductImage, deleteProductImage, MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/storage/local";

/**
 * Product image upload for the admin panel. Requires an authenticated admin
 * session. Writes to local disk under PRODUCT_IMAGES_DIR (see
 * src/lib/storage/local.ts) and returns the app's own serving URL
 * (/api/storage/products/<uuid>.<ext>) to store on `products.images` — the
 * same shape a Supabase Storage public URL used to be, so ImageUploader.tsx
 * and the rest of the admin form need no changes beyond this route and the
 * error-code rename below.
 */
export async function POST(request: Request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveProductImage(buffer, file.type);
    return NextResponse.json({ url: saved.url });
  } catch (err) {
    console.error("[admin/upload] local storage write failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}

/**
 * Deletes a product photo from local disk when an admin removes it in
 * ImageUploader — without this, "removing" a photo only ever dropped the URL
 * from `products.images`, leaving the actual file orphaned on disk forever.
 * Requires an authenticated admin session, same as upload. Accepts either a
 * bare filename or a full /api/storage/products/<filename> URL — see
 * deleteProductImage() in src/lib/storage/local.ts, which silently no-ops
 * for anything that isn't one of ours (e.g. a legacy external URL) or that's
 * already gone, so "remove" in the UI always succeeds from the caller's POV.
 */
export async function DELETE(request: Request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : null;
  if (!url) return NextResponse.json({ error: "no_url" }, { status: 400 });

  try {
    await deleteProductImage(url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/upload] local storage delete failed", err);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
