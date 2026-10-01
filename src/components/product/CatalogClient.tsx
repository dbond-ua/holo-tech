"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { BaseProduct, CategorySlug } from "@/lib/types";
import { powerBuckets, capacityBuckets, inBucket, sortOptions, type SortKey } from "@/lib/filters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";
import { Sheet } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

interface QuickToggle {
  key: keyof BaseProduct;
  labelKey: "fastCharge" | "lifepo4" | "upsToggle" | "solarToggle" | "bluetoothToggle" | "wifiToggle";
}

const stationToggles: QuickToggle[] = [
  { key: "fastCharge", labelKey: "fastCharge" },
  { key: "isLiFePO4", labelKey: "lifepo4" },
  { key: "hasUPS", labelKey: "upsToggle" },
  { key: "solarCharging", labelKey: "solarToggle" },
  { key: "bluetooth", labelKey: "bluetoothToggle" },
  { key: "wifi", labelKey: "wifiToggle" },
];

export function CatalogClient({
  category,
  products,
}: {
  category: CategorySlug;
  products: BaseProduct[];
}) {
  const { dict } = useI18n();

  const sortLabels: Record<SortKey, string> = {
    popular: dict.catalog.sortPopular,
    new: dict.catalog.sortNew,
    "price-asc": dict.catalog.sortPriceAsc,
    "price-desc": dict.catalog.sortPriceDesc,
    rating: dict.catalog.sortRating,
  };

  const brandsAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );
  const priceMin = useMemo(() => Math.min(...products.map((p) => p.price)), [products]);
  const priceMax = useMemo(() => Math.max(...products.map((p) => p.price)), [products]);
  const phasesAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.phase).filter(Boolean))) as string[],
    [products]
  );
  const mpptAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.mppt).filter((v): v is number => typeof v === "number"))).sort(
      (a, b) => a - b
    ),
    [products]
  );
  const inverterTypesAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.inverterType).filter(Boolean))) as string[],
    [products]
  );

  const [brands, setBrands] = useState<string[]>([]);
  const [powerBucketKeys, setPowerBucketKeys] = useState<string[]>([]);
  const [capacityBucketKeys, setCapacityBucketKeys] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax]);
  const [priceTouched, setPriceTouched] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<string[]>([]);
  const [mppt, setMppt] = useState<number[]>([]);
  const [inverterType, setInverterType] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const effectivePriceRange: [number, number] = priceTouched ? priceRange : [priceMin, priceMax];

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (brands.length && !brands.includes(p.brand)) return false;
      if (p.price < effectivePriceRange[0] || p.price > effectivePriceRange[1]) return false;

      if (powerBucketKeys.length) {
        const matches = powerBuckets
          .filter((b) => powerBucketKeys.includes(b.key))
          .some((b) => inBucket(p.powerW, b));
        if (!matches) return false;
      }

      if (capacityBucketKeys.length) {
        const matches = capacityBuckets
          .filter((b) => capacityBucketKeys.includes(b.key))
          .some((b) => inBucket(p.capacityWh, b));
        if (!matches) return false;
      }

      for (const [key, on] of Object.entries(toggles)) {
        if (on && !(p as unknown as Record<string, unknown>)[key]) return false;
      }

      if (phase.length && (!p.phase || !phase.includes(p.phase))) return false;
      if (mppt.length && (p.mppt === undefined || !mppt.includes(p.mppt))) return false;
      if (inverterType.length && (!p.inverterType || !inverterType.includes(p.inverterType))) return false;

      return true;
    });
  }, [products, brands, effectivePriceRange, powerBucketKeys, capacityBucketKeys, toggles, phase, mppt, inverterType]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "new":
        return arr.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.reviewsCount - a.reviewsCount);
      case "price-asc":
        return arr.sort((a, b) => a.price - b.price);
      case "price-desc":
        return arr.sort((a, b) => b.price - a.price);
      case "rating":
        return arr.sort((a, b) => b.rating - a.rating);
      default:
        return arr.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || b.reviewsCount - a.reviewsCount);
    }
  }, [filtered, sort]);

  const activeFilterCount =
    brands.length +
    powerBucketKeys.length +
    capacityBucketKeys.length +
    phase.length +
    mppt.length +
    inverterType.length +
    Object.values(toggles).filter(Boolean).length +
    (priceTouched ? 1 : 0);

  function resetFilters() {
    setBrands([]);
    setPowerBucketKeys([]);
    setCapacityBucketKeys([]);
    setPriceTouched(false);
    setPriceRange([priceMin, priceMax]);
    setToggles({});
    setPhase([]);
    setMppt([]);
    setInverterType([]);
  }

  const filtersContent = (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-3 text-sm font-semibold">{dict.catalog.priceGroup}</p>
        <PriceRangeSlider
          min={priceMin}
          max={priceMax}
          value={effectivePriceRange}
          onChange={(v) => {
            setPriceTouched(true);
            setPriceRange(v);
          }}
        />
      </div>

      {brandsAvailable.length > 1 && (
        <div>
          <p className="mb-3 text-sm font-semibold">{dict.catalog.brandGroup}</p>
          <div className="flex flex-col gap-2.5">
            {brandsAvailable.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={brands.includes(b)}
                  onChange={() => toggle(brands, b, setBrands)}
                  className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                />
                {b}
              </label>
            ))}
          </div>
        </div>
      )}

      {category === "stations" && (
        <>
          <div>
            <p className="mb-3 text-sm font-semibold">{dict.catalog.powerGroup}</p>
            <div className="flex flex-col gap-2.5">
              {powerBuckets.map((b) => (
                <label key={b.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={powerBucketKeys.includes(b.key)}
                    onChange={() => toggle(powerBucketKeys, b.key, setPowerBucketKeys)}
                    className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">{dict.catalog.capacityGroup}</p>
            <div className="flex flex-col gap-2.5">
              {capacityBuckets.map((b) => (
                <label key={b.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={capacityBucketKeys.includes(b.key)}
                    onChange={() => toggle(capacityBucketKeys, b.key, setCapacityBucketKeys)}
                    className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">{dict.catalog.extraGroup}</p>
            <div className="flex flex-col gap-2.5">
              {stationToggles.map((t) => (
                <label key={t.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={!!toggles[t.key as string]}
                    onChange={() =>
                      setToggles((prev) => ({ ...prev, [t.key as string]: !prev[t.key as string] }))
                    }
                    className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                  />
                  {dict.catalog[t.labelKey]}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {category === "inverters" && (
        <>
          {phasesAvailable.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold">{dict.catalog.phaseGroup}</p>
              <div className="flex flex-col gap-2.5">
                {phasesAvailable.map((ph) => (
                  <label key={ph} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={phase.includes(ph)}
                      onChange={() => toggle(phase, ph, setPhase)}
                      className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                    />
                    {ph === "single" ? dict.specs.phaseSingle : dict.specs.phaseThree}
                  </label>
                ))}
              </div>
            </div>
          )}

          {mpptAvailable.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold">{dict.catalog.mpptGroup}</p>
              <div className="flex flex-col gap-2.5">
                {mpptAvailable.map((m) => (
                  <label key={m} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={mppt.includes(m)}
                      onChange={() => toggle(mppt, m, setMppt)}
                      className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          )}

          {inverterTypesAvailable.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold">{dict.catalog.typeGroup}</p>
              <div className="flex flex-col gap-2.5">
                {inverterTypesAvailable.map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={inverterType.includes(t)}
                      onChange={() => toggle(inverterType, t, setInverterType)}
                      className="h-4 w-4 rounded border-line accent-ink dark:border-line-dark dark:accent-white"
                    />
                    {t === "hybrid" ? dict.specs.typeHybrid : t === "grid" ? dict.specs.typeGrid : dict.specs.typeOffgrid}
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">{dict.catalog.filters}</p>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
              >
                {dict.catalog.reset}
              </button>
            )}
          </div>
          {filtersContent}
        </div>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted dark:text-muted-dark">
            {dict.catalog.found(sorted.length)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium lg:hidden dark:border-line-dark"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {dict.catalog.filters}
              {activeFilterCount > 0 && (
                <Badge tone="accent" className="ml-0.5">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={dict.catalog.filters}
              className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium outline-none dark:border-line-dark dark:bg-surface-dark"
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {sortLabels[o.key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => toggle(brands, b, setBrands)}
                className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium dark:bg-white/10"
              >
                {b} <X className="h-3 w-3" />
              </button>
            ))}
            {powerBucketKeys.map((k) => (
              <button
                key={k}
                onClick={() => toggle(powerBucketKeys, k, setPowerBucketKeys)}
                className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium dark:bg-white/10"
              >
                {powerBuckets.find((b) => b.key === k)?.label} <X className="h-3 w-3" />
              </button>
            ))}
            {capacityBucketKeys.map((k) => (
              <button
                key={k}
                onClick={() => toggle(capacityBucketKeys, k, setCapacityBucketKeys)}
                className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium dark:bg-white/10"
              >
                {capacityBuckets.find((b) => b.key === k)?.label} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <ProductGrid products={sorted} />
      </div>

      <Sheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        side="bottom"
        title={dict.catalog.filters}
      >
        <div className={cn("p-5")}>{filtersContent}</div>
        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark">
          <button
            onClick={resetFilters}
            className="flex-1 rounded-full border border-line py-3 text-sm font-medium dark:border-line-dark"
          >
            {dict.catalog.reset}
          </button>
          <button
            onClick={() => setMobileFiltersOpen(false)}
            className="flex-1 rounded-full bg-ink py-3 text-sm font-medium text-white dark:bg-white dark:text-ink"
          >
            {dict.catalog.showResults(sorted.length)}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
