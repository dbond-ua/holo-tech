import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { PRODUCT_IMAGES_DIR } from "@/lib/env";

/**
 * Local-disk product photo storage — replaces Supabase Storage now that the
 * project is fully self-hosted. Files live under PRODUCT_IMAGES_DIR (default
 * ./storage/products, outside `public/` and outside git — see .gitignore)
 * and are served back out through src/app/api/storage/products/[filename],
 * never directly by the web server, so there is never a raw filesystem path
 * exposed to a visitor and never a directory listing.
 *
 * Security model for this module specifically:
 *  - Every filename this app writes is a fresh `crypto.randomUUID()` plus a
 *    known extension — never derived from user input (the uploaded file's
 *    original name is discarded entirely).
 *  - Every filename this app reads back (for serving or deleting) is
 *    validated against the exact same fixed shape before touching the
 *    filesystem, which is what actually rules out path traversal
 *    ("../../etc/passwd" can never match `SAFE_FILENAME`). The resolved-path
 *    containment check in each function is defense in depth on top of that,
 *    not a replacement for it.
 */

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = Object.keys(ALLOWED_EXTENSIONS);

// e.g. "b3f1c2a0-4e3a-4c9b-9f0a-1234567890ab.webp" — a bare v4-shaped UUID
// plus one of the four allowed extensions. Nothing else matches, by design.
const SAFE_FILENAME = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp|avif)$/;

export function isSafeImageFilename(name: string): boolean {
  return SAFE_FILENAME.test(name);
}

function resolveStorageDir(): string {
  return path.isAbsolute(PRODUCT_IMAGES_DIR) ? PRODUCT_IMAGES_DIR : path.join(process.cwd(), PRODUCT_IMAGES_DIR);
}

/** Resolves a filename to an absolute on-disk path, or null if the filename
 *  doesn't match the safe shape or somehow resolves outside the storage
 *  directory. Used by both the read (serving) and delete paths. */
export function resolveProductImagePath(filename: string): string | null {
  if (!isSafeImageFilename(filename)) return null;
  const dir = resolveStorageDir();
  const filePath = path.join(dir, filename);
  if (!filePath.startsWith(dir + path.sep)) return null;
  return filePath;
}

export function contentTypeForFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? (CONTENT_TYPE_BY_EXT[ext] ?? null) : null;
}

export interface SavedImage {
  filename: string;
  /** Path to fetch this image back through the app's own serving route —
   *  store this in products.images, exactly like the old Supabase public
   *  URL was stored there. */
  url: string;
}

/** Writes a validated image buffer to disk under a fresh random filename.
 *  Throws "unsupported_type" for a MIME type outside ALLOWED_IMAGE_TYPES —
 *  callers should already have checked this (see the upload route), this is
 *  a second, cheap guard rather than the primary validation. */
export async function saveProductImage(buffer: Buffer, mimeType: string): Promise<SavedImage> {
  const ext = ALLOWED_EXTENSIONS[mimeType];
  if (!ext) throw new Error("unsupported_type");

  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = resolveStorageDir();
  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, filename);
  if (!filePath.startsWith(dir + path.sep)) throw new Error("invalid_path");

  await writeFile(filePath, buffer);
  return { filename, url: `/api/storage/products/${filename}` };
}

/** Deletes an image by filename OR by a URL previously returned from
 *  saveProductImage (the filename is extracted from it) — mirrors the old
 *  Supabase Storage delete, which also accepted a public URL. Silently does
 *  nothing for a filename that isn't one of ours (e.g. a legacy external
 *  URL) or that's already gone — deletion here is meant to be idempotent
 *  from the caller's point of view (see ImageUploader.tsx: "remove" always
 *  drops the URL from the product's list even if the underlying file delete
 *  fails or was already done). */
export async function deleteProductImage(filenameOrUrl: string): Promise<void> {
  const filename = filenameOrUrl.includes("/") ? (filenameOrUrl.split("/").pop() ?? "") : filenameOrUrl;
  const filePath = resolveProductImagePath(filename);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
  }
}
