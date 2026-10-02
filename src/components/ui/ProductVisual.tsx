import type { ReactNode } from "react";
import type { CategorySlug } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Fallback product illustration, used until a product has real photos
 * (product.imageUrls). Instead of a glowing icon tile it draws a quiet,
 * technical line drawing of the product type on the neutral "stage" — the
 * same backdrop real photos sit on — so a catalog with mixed photo / no-photo
 * products still reads as one consistent grid.
 *
 * `seed` is accepted for API compatibility with older call sites; the drawing
 * is deliberately identical per category (consistency over novelty).
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

function Dim({ d }: { d: string }) {
  // Dimension line — the "spec sheet" detail. Thinner and fainter.
  return <path d={d} {...stroke} strokeWidth={1} opacity={0.45} />;
}

const drawings: Record<CategorySlug, (compact: boolean) => ReactNode> = {
  stations: (compact) => (
    <>
      <rect x="62" y="62" width="116" height="78" rx="6" {...stroke} />
      <path d="M88 62V48a4 4 0 0 1 4-4h56a4 4 0 0 1 4 4v14" {...stroke} />
      <path d="M98 62v-8h44v8" {...stroke} />
      <rect x="74" y="76" width="34" height="20" rx="1.5" {...stroke} />
      <rect x="122" y="76" width="18" height="18" rx="3" {...stroke} />
      <rect x="146" y="76" width="18" height="18" rx="3" {...stroke} />
      <path d="M128 85h.01M134 85h.01M152 85h.01M158 85h.01" {...stroke} strokeWidth={2.5} />
      <path d="M74 110h6M86 110h6M98 110h6" {...stroke} />
      <path d="M122 112h42M122 118h42M122 124h42" {...stroke} opacity={0.6} />
      <path d="M72 140v4M168 140v4" {...stroke} />
      {!compact && <Dim d="M62 160h116M62 156v8M178 156v8" />}
    </>
  ),
  inverters: (compact) => (
    <>
      <rect x="84" y="24" width="72" height="126" rx="4" {...stroke} />
      <rect x="98" y="40" width="44" height="24" rx="1.5" {...stroke} />
      <path d="M102 78h.01M110 78h.01M118 78h.01" {...stroke} strokeWidth={3} />
      <path d="M98 92h44" {...stroke} opacity={0.6} />
      <path d="M98 134h8M112 134h8M126 134h8" {...stroke} />
      <path d="M156 42h6M156 52h6M156 62h6M156 72h6M156 82h6" {...stroke} opacity={0.6} />
      {!compact && <Dim d="M176 24v126M172 24h8M172 150h8" />}
    </>
  ),
  batteries: (compact) => (
    <>
      <rect x="40" y="62" width="160" height="58" rx="3" {...stroke} />
      <path d="M30 62h10v58H30z M200 62h10v58h-10z" {...stroke} />
      <path d="M35 70h.01M35 112h.01M205 70h.01M205 112h.01" {...stroke} strokeWidth={3} />
      <circle cx="62" cy="80" r="6" {...stroke} />
      <circle cx="62" cy="102" r="6" {...stroke} />
      <path d="M59 80h6M62 77v6M59 102h6" {...stroke} />
      <path d="M88 78h.01M96 78h.01M104 78h.01M112 78h.01" {...stroke} strokeWidth={3} />
      <rect x="88" y="94" width="64" height="8" rx="1" {...stroke} />
      <rect x="88" y="94" width="42" height="8" rx="1" fill="currentColor" opacity={0.18} />
      <path d="M176 76v30" {...stroke} />
      {!compact && <Dim d="M40 138h160M40 134v8M200 134v8" />}
    </>
  ),
  "solar-panels": (compact) => (
    <>
      <rect x="64" y="18" width="112" height="124" rx="2" {...stroke} />
      <path
        d="M92 22v116M120 22v116M148 22v116M68 42.5h104M68 63h104M68 83.5h104M68 104h104M68 124.5h104"
        {...stroke}
        opacity={0.55}
      />
      <path d="M100 142l-8 20M140 142l8 20" {...stroke} />
      {!compact && <Dim d="M188 18v124M184 18h8M184 142h8" />}
    </>
  ),
  kits: (compact) => (
    <>
      <rect x="50" y="34" width="56" height="84" rx="3" {...stroke} />
      <rect x="60" y="46" width="36" height="16" rx="1.5" {...stroke} />
      <path d="M62 74h.01M70 74h.01M78 74h.01" {...stroke} strokeWidth={3} />
      <rect x="124" y="30" width="66" height="120" rx="3" {...stroke} />
      <path d="M124 70h66M124 110h66" {...stroke} opacity={0.7} />
      <path d="M176 50h.01M176 90h.01M176 130h.01" {...stroke} strokeWidth={3} />
      <path d="M136 50h20M136 90h20M136 130h20" {...stroke} opacity={0.6} />
      <path d="M106 104c10 0 8-34 18-34" {...stroke} />
      {!compact && <Dim d="M40 160h160" />}
    </>
  ),
  accessories: (compact) => (
    <>
      <circle cx="98" cy="88" r="40" {...stroke} />
      <circle cx="98" cy="88" r="30" {...stroke} opacity={0.7} />
      <circle cx="98" cy="88" r="20" {...stroke} opacity={0.45} />
      <path d="M138 88c18 0 20 30 36 30" {...stroke} />
      <rect x="174" y="108" width="24" height="20" rx="3" {...stroke} />
      <path d="M198 113h8M198 123h8" {...stroke} />
      {!compact && <Dim d="M58 150h80M58 146v8M138 146v8" />}
    </>
  ),
};

export function ProductVisual({
  category,
  className,
  compact = false,
}: {
  category: CategorySlug;
  seed?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden bg-stage text-fg/45", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 180" className={cn("h-auto", compact ? "w-[88%]" : "w-[76%] max-w-[420px]")}>
        {drawings[category](compact)}
      </svg>
    </div>
  );
}

/**
 * Product image on the stage. Real photo when available (white-background
 * product shots blend into the stage via multiply in light mode), otherwise
 * the line drawing above.
 */
export function ProductImage({
  src,
  alt,
  category,
  className,
  imgClassName,
  compact = false,
  priority = false,
}: {
  src?: string;
  alt: string;
  category: CategorySlug;
  className?: string;
  imgClassName?: string;
  compact?: boolean;
  priority?: boolean;
}) {
  if (!src) return <ProductVisual category={category} compact={compact} className={className} />;
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-stage", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn(
          "h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal",
          compact ? "p-[6%]" : "p-[8%]",
          imgClassName
        )}
      />
    </div>
  );
}
