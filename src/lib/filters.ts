export interface Bucket {
  key: string;
  label: string;
  min: number;
  max: number; // Infinity for open-ended
}

export const powerBuckets: Bucket[] = [
  { key: "p1", label: "до 500 Вт", min: 0, max: 500 },
  { key: "p2", label: "500–1000 Вт", min: 500, max: 1000 },
  { key: "p3", label: "1000–2000 Вт", min: 1000, max: 2000 },
  { key: "p4", label: "2000–3000 Вт", min: 2000, max: 3000 },
  { key: "p5", label: "3000+ Вт", min: 3000, max: Infinity },
];

export const capacityBuckets: Bucket[] = [
  { key: "c1", label: "до 500 Втч", min: 0, max: 500 },
  { key: "c2", label: "500–1000 Втч", min: 500, max: 1000 },
  { key: "c3", label: "1000–2000 Втч", min: 1000, max: 2000 },
  { key: "c4", label: "2000–3000 Втч", min: 2000, max: 3000 },
  { key: "c5", label: "3000+ Втч", min: 3000, max: Infinity },
];

export function inBucket(value: number | undefined, bucket: Bucket): boolean {
  if (value === undefined) return false;
  return value >= bucket.min && value < bucket.max;
}

export type SortKey = "popular" | "new" | "price-asc" | "price-desc" | "rating";

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Популярные" },
  { key: "new", label: "Новинки" },
  { key: "price-asc", label: "Сначала дешевые" },
  { key: "price-desc", label: "Сначала дорогие" },
  { key: "rating", label: "По рейтингу" },
];
