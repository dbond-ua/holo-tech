"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

interface ImageUploaderProps {
  name: string;
  initialImages?: string[];
}

/** Uploads selected files to /api/admin/upload one at a time, shows
 *  thumbnails, and keeps the resulting URL list in a hidden input so it
 *  submits along with the surrounding product form. */
export function ImageUploader({ name, initialImages = [] }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setError(data.error ?? "upload_failed");
          continue;
        }
        setImages((prev) => [...prev, data.url!]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // Removing a photo also deletes the underlying Storage object — best
  // effort, never blocks the form: if the delete call fails (network hiccup,
  // already gone) the URL still drops from the list so the admin isn't stuck.
  async function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
    try {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      console.error("[ImageUploader] failed to delete storage object", err);
    }
  }

  // Index 0 is the main photo everywhere it's read (Gallery, ProductCard,
  // ProductDetailView) — "set as main" just moves the clicked photo to the
  // front, no separate "is_main" flag needed.
  function setMain(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  }

  return (
    <div>
      <input type="hidden" name={name} value={images.join(",")} />

      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-canvas">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Головне
              </span>
            )}
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => setMain(url)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Зробити головним"
                  title="Зробити головним"
                >
                  <Star className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Видалити зображення"
                title="Видалити"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line text-muted transition-colors hover:border-ink hover:text-ink">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-xs">{uploading ? "Завантаження…" : "Додати"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          Помилка завантаження: {error}
        </p>
      )}
    </div>
  );
}
