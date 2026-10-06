"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import type { BaseProduct, CategorySlug } from "@/lib/types";
import { powerBuckets, capacityBuckets, inBucket, sortOptions, type Bucket, type SortKey } from "@/lib/filters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
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

type FilterGroup = "brand" | "power" | "capacity" | "toggle" | "phase" | "mppt" | "type" | "price" | "section" | "ptype";
const VIEW_STORAGE_KEY = "holotech:catalog-view";

/**
 * Catalog: sticky filter column (desktop) / filter sheet (mobile), toolbar
 * with count, sort and grid/list toggle, removable chips for active filters.
 * Option counts are facet counts — how many products the option would show
 * given every *other* active filter — and options that would give zero
 * results are dimmed.
 *
 * Filtering logic is the same as before; `?brand=` in the URL (used by the
 * header mega-menu) preselects a brand.
 */
export function CatalogClient({
  category,
  products,
}: {
  category: CategorySlug;
  products: BaseProduct[];
}) {
  const { dict } = useI18n();
  const u = dict.units;

  const sortLabels: Record<SortKey, string> = {
    popular: dict.catalog.sortPopular,
    new: dict.catalog.sortNew,
    "price-asc": dict.catalog.sortPriceAsc,
    "price-desc": dict.catalog.sortPriceDesc,
    rating: dict.catalog.sortRating,
  };

  const bucketLabel = (b: Bucket, unit: string) =>
    b.min === 0 ? `${dict.ui.upTo} ${b.max} ${unit}` : b.max === Infinity ? `${b.min}+ ${unit}` : `${b.min}–${b.max} ${unit}`;

  // Products without a brand (e.g. supplier imports with a blank brand) stay
  // in the list but get no empty-named option in the brand filter.
  const brandsAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  );
  const priceMin = useMemo(() => Math.min(...products.map((p) => p.price)), [products]);
  const priceMax = useMemo(() => Math.max(...products.map((p) => p.price)), [products]);
  const phasesAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.phase).filter(Boolean))) as string[],
    [products]
  );
  const mpptAvailable = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.mppt).filter((v): v is number => typeof v === "number"))).sort(
        (a, b) => a - b
      ),
    [products]
  );
  const inverterTypesAvailable = useMemo(
    () => Array.from(new Set(products.map((p) => p.inverterType).filter(Boolean))) as string[],
    [products]
  );
  // Supplier grouping (electronics range): "Розділ" and "Тип", most common first.
  const byFrequency = (values: (string | undefined)[]) => {
    const counts = new Map<string, number>();
    for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    return Array.from(counts.keys()).sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b, "uk"));
  };
  const sectionsAvailable = useMemo(() => byFrequency(products.map((p) => p.subcategory)), [products]);
  const productTypesAvailable = useMemo(() => byFrequency(products.map((p) => p.productType)), [products]);
  // "Розділ" only adds information when it groups several types together.
  const sectionAddsInfo = useMemo(
    () => sectionsAvailable.length > 1 && products.some((p) => p.subcategory && p.subcategory !== p.productType),
    [products, sectionsAvailable]
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
  const [sections, setSections] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ?brand=EcoFlow preselect (from the mega-menu) + remembered view mode.
  useEffect(() => {
    const brand = new URLSearchParams(window.location.search).get("brand");
    if (brand && brandsAvailable.includes(brand as BaseProduct["brand"])) setBrands([brand]);
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {
      // storage unavailable — keep default
    }
  }, [brandsAvailable]);

  function changeView(next: "grid" | "list") {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const effectivePriceRange: [number, number] = priceTouched ? priceRange : [priceMin, priceMax];

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  /** Does `p` pass every active filter, optionally ignoring one group (for facet counts)? */
  function passes(p: BaseProduct, except?: FilterGroup): boolean {
    if (except !== "brand" && brands.length && !brands.includes(p.brand)) return false;
    if (except !== "price" && (p.price < effectivePriceRange[0] || p.price > effectivePriceRange[1])) return false;
    if (except !== "power" && powerBucketKeys.length) {
      if (!powerBuckets.filter((b) => powerBucketKeys.includes(b.key)).some((b) => inBucket(p.powerW, b))) return false;
    }
    if (except !== "capacity" && capacityBucketKeys.length) {
      if (!capacityBuckets.filter((b) => capacityBucketKeys.includes(b.key)).some((b) => inBucket(p.capacityWh, b)))
        return false;
    }
    if (except !== "toggle") {
      for (const [key, on] of Object.entries(toggles)) {
        if (on && !(p as unknown as Record<string, unknown>)[key]) return false;
      }
    }
    if (except !== "phase" && phase.length && (!p.phase || !phase.includes(p.phase))) return false;
    if (except !== "mppt" && mppt.length && (p.mppt === undefined || !mppt.includes(p.mppt))) return false;
    if (except !== "type" && inverterType.length && (!p.inverterType || !inverterType.includes(p.inverterType)))
      return false;
    if (except !== "section" && sections.length && (!p.subcategory || !sections.includes(p.subcategory))) return false;
    if (except !== "ptype" && productTypes.length && (!p.productType || !productTypes.includes(p.productType)))
      return false;
    return true;
  }

  const filtered = products.filter((p) => passes(p));
  const facet = (group: FilterGroup, test: (p: BaseProduct) => boolean) =>
    products.filter((p) => passes(p, group) && test(p)).length;

  const sorted = (() => {
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
  })();

  const activeFilterCount =
    brands.length +
    powerBucketKeys.length +
    capacityBucketKeys.length +
    phase.length +
    mppt.length +
    inverterType.length +
    sections.length +
    productTypes.length +
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
    setSections([]);
    setProductTypes([]);
  }

  /* --- Filter UI ------------------------------------------------------- */

  const optionRow = (key: string, label: ReactNode, checked: boolean, count: number, onChange: () => void) => (
    <label
      key={key}
      className={cn(
        "flex cursor-pointer items-center gap-3 py-1.5 text-[15px] lg:text-sm",
        !checked && count === 0 && "opacity-40"
      )}
    >
      <input type="checkbox" className="check" checked={checked} onChange={onChange} />
      <span className="flex-1">{label}</span>
      <span className="spec text-fg-3">{count}</span>
    </label>
  );

  const groups: { key: string; title: string; content: ReactNode; show: boolean }[] = [
    {
      key: "section",
      title: dict.ui.sectionGroup,
      show: sectionAddsInfo,
      content: sectionsAvailable.map((s) =>
        optionRow(s, s, sections.includes(s), facet("section", (p) => p.subcategory === s), () =>
          toggle(sections, s, setSections)
        )
      ),
    },
    {
      key: "ptype",
      title: dict.ui.productTypeGroup,
      show: productTypesAvailable.length > 1,
      // With a section picked, types from other sections are hidden rather
      // than listed with a zero count — keeps a 40-type list usable.
      content: productTypesAvailable.flatMap((t) => {
        const count = facet("ptype", (p) => p.productType === t);
        if (sections.length && count === 0 && !productTypes.includes(t)) return [];
        return [optionRow(t, t, productTypes.includes(t), count, () => toggle(productTypes, t, setProductTypes))];
      }),
    },
    {
      key: "price",
      title: dict.catalog.priceGroup,
      show: priceMax > priceMin,
      content: (
        <PriceRangeSlider
          min={priceMin}
          max={priceMax}
          value={effectivePriceRange}
          labels={{ from: dict.ui.priceFrom, to: dict.ui.priceTo }}
          onChange={(v) => {
            setPriceTouched(true);
            setPriceRange(v);
          }}
        />
      ),
    },
    {
      key: "brand",
      title: dict.catalog.brandGroup,
      show: brandsAvailable.length > 1,
      content: brandsAvailable.map((b) =>
        optionRow(b, b, brands.includes(b), facet("brand", (p) => p.brand === b), () => toggle(brands, b, setBrands))
      ),
    },
    {
      key: "power",
      title: dict.catalog.powerGroup,
      show: category === "stations",
      content: powerBuckets.map((b) =>
        optionRow(
          b.key,
          bucketLabel(b, u.w),
          powerBucketKeys.includes(b.key),
          facet("power", (p) => inBucket(p.powerW, b)),
          () => toggle(powerBucketKeys, b.key, setPowerBucketKeys)
        )
      ),
    },
    {
      key: "capacity",
      title: dict.catalog.capacityGroup,
      show: category === "stations",
      content: capacityBuckets.map((b) =>
        optionRow(
          b.key,
          bucketLabel(b, u.wh),
          capacityBucketKeys.includes(b.key),
          facet("capacity", (p) => inBucket(p.capacityWh, b)),
          () => toggle(capacityBucketKeys, b.key, setCapacityBucketKeys)
        )
      ),
    },
    {
      key: "toggle",
      title: dict.catalog.extraGroup,
      show: category === "stations",
      content: stationToggles.map((t) =>
        optionRow(
          t.key as string,
          dict.catalog[t.labelKey],
          !!toggles[t.key as string],
          facet("toggle", (p) => !!(p as unknown as Record<string, unknown>)[t.key as string]),
          () => setToggles((prev) => ({ ...prev, [t.key as string]: !prev[t.key as string] }))
        )
      ),
    },
    {
      key: "phase",
      title: dict.catalog.phaseGroup,
      show: category === "inverters" && phasesAvailable.length > 0,
      content: phasesAvailable.map((ph) =>
        optionRow(
          ph,
          ph === "single" ? dict.specs.phaseSingle : dict.specs.phaseThree,
          phase.includes(ph),
          facet("phase", (p) => p.phase === ph),
          () => toggle(phase, ph, setPhase)
        )
      ),
    },
    {
      key: "mppt",
      title: dict.catalog.mpptGroup,
      show: category === "inverters" && mpptAvailable.length > 0,
      content: mpptAvailable.map((m) =>
        optionRow(String(m), String(m), mppt.includes(m), facet("mppt", (p) => p.mppt === m), () =>
          toggle(mppt, m, setMppt)
        )
      ),
    },
    {
      key: "type",
      title: dict.catalog.typeGroup,
      show: category === "inverters" && inverterTypesAvailable.length > 0,
      content: inverterTypesAvailable.map((t) =>
        optionRow(
          t,
          t === "hybrid" ? dict.specs.typeHybrid : t === "grid" ? dict.specs.typeGrid : dict.specs.typeOffgrid,
          inverterType.includes(t),
          facet("type", (p) => p.inverterType === t),
          () => toggle(inverterType, t, setInverterType)
        )
      ),
    },
  ];

  const filtersContent = (
    <div>
      {groups
        .filter((g) => g.show)
        .map((g) => (
          <FilterSection key={g.key} title={g.title}>
            {g.content}
          </FilterSection>
        ))}
    </div>
  );

  /* --- Active chips ---------------------------------------------------- */

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...brands.map((b) => ({ key: `b-${b}`, label: b, remove: () => toggle(brands, b, setBrands) })),
    ...powerBucketKeys.map((k) => ({
      key: `p-${k}`,
      label: bucketLabel(powerBuckets.find((b) => b.key === k)!, u.w),
      remove: () => toggle(powerBucketKeys, k, setPowerBucketKeys),
    })),
    ...capacityBucketKeys.map((k) => ({
      key: `c-${k}`,
      label: bucketLabel(capacityBuckets.find((b) => b.key === k)!, u.wh),
      remove: () => toggle(capacityBucketKeys, k, setCapacityBucketKeys),
    })),
    ...stationToggles
      .filter((t) => toggles[t.key as string])
      .map((t) => ({
        key: `t-${String(t.key)}`,
        label: dict.catalog[t.labelKey],
        remove: () => setToggles((prev) => ({ ...prev, [t.key as string]: false })),
      })),
    ...phase.map((ph) => ({
      key: `ph-${ph}`,
      label: ph === "single" ? dict.specs.phaseSingle : dict.specs.phaseThree,
      remove: () => toggle(phase, ph, setPhase),
    })),
    ...mppt.map((m) => ({ key: `m-${m}`, label: `MPPT ${m}`, remove: () => toggle(mppt, m, setMppt) })),
    ...sections.map((s) => ({ key: `sec-${s}`, label: s, remove: () => toggle(sections, s, setSections) })),
    ...productTypes.map((t) => ({ key: `pt-${t}`, label: t, remove: () => toggle(productTypes, t, setProductTypes) })),
    ...inverterType.map((t) => ({
      key: `it-${t}`,
      label: t === "hybrid" ? dict.specs.typeHybrid : t === "grid" ? dict.specs.typeGrid : dict.specs.typeOffgrid,
      remove: () => toggle(inverterType, t, setInverterType),
    })),
    ...(priceTouched
      ? [
          {
            key: "price",
            label: `${effectivePriceRange[0].toLocaleString("uk-UA")}–${effectivePriceRange[1].toLocaleString("uk-UA")} ₴`,
            remove: () => {
              setPriceTouched(false);
              setPriceRange([priceMin, priceMax]);
            },
          },
        ]
      : []),
  ];

  const sortSelect = (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{dict.ui.sortLabel}</span>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as SortKey)}
        className="h-10 cursor-pointer appearance-none rounded-md bg-transparent pl-3 pr-8 text-sm font-medium outline-none transition-colors hover:bg-fg/[0.05]"
      >
        {sortOptions.map((o) => (
          <option key={o.key} value={o.key}>
            {sortLabels[o.key]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-fg-2" strokeWidth={1.5} />
    </label>
  );

  const viewToggle = (
    <div className="flex items-center" role="group" aria-label={`${dict.ui.viewGrid} / ${dict.ui.viewList}`}>
      {(
        [
          { v: "grid", icon: LayoutGrid, label: dict.ui.viewGrid },
          { v: "list", icon: List, label: dict.ui.viewList },
        ] as const
      ).map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => changeView(v)}
          aria-pressed={view === v}
          aria-label={label}
          title={label}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
            view === v ? "text-fg" : "text-fg-3 hover:text-fg"
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10">
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-[7.75rem] max-h-[calc(100vh-8.5rem)] overflow-y-auto pb-10 pr-1">
          <div className="flex h-12 items-center justify-between border-y border-fg">
            <p className="text-sm font-semibold">{dict.catalog.filters}</p>
            {activeFilterCount > 0 && (
              <button type="button" onClick={resetFilters} className="text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline">
                {dict.ui.resetAll}
              </button>
            )}
          </div>
          {filtersContent}
        </div>
      </aside>

      <div className="min-w-0 lg:col-span-9">
        {/* Toolbar — sticky under the header on mobile */}
        <div className="sticky top-14 z-30 -mx-4 flex h-12 items-center gap-1 border-y border-fg bg-paper px-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="-ml-2 inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {dict.ui.showFilters(activeFilterCount)}
          </button>
          {activeFilterCount > 0 && (
            <p className="spec hidden text-fg-2 lg:block">{dict.catalog.found(sorted.length)}</p>
          )}
          <span className="flex-1" />
          {sortSelect}
          <span className="mx-1 hidden h-5 w-px bg-rule sm:block" aria-hidden="true" />
          <div className="hidden sm:block">{viewToggle}</div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-4">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.remove}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-fg px-2.5 text-[13px] font-medium transition-colors hover:bg-fg hover:text-paper"
              >
                {c.label}
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline"
            >
              {dict.ui.resetAll}
            </button>
          </div>
        )}

        {activeFilterCount > 0 && <p className="spec py-3 text-fg-2 lg:hidden">{dict.catalog.found(sorted.length)}</p>}

        <ProductGrid
          products={sorted}
          view={view}
          pageSize={48}
          className={cn(chips.length === 0 && "mt-4 lg:mt-6")}
        />
      </div>

      <Sheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        side="bottom"
        title={dict.catalog.filters}
        footer={
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Button variant="outline" size="lg" onClick={resetFilters} disabled={activeFilterCount === 0}>
              {dict.catalog.reset}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setMobileFiltersOpen(false)}>
              {dict.catalog.showResults(sorted.length)}
            </Button>
          </div>
        }
      >
        <div className="px-5 pb-6">{filtersContent}</div>
      </Sheet>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-rule">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between text-left text-[15px] font-medium lg:text-sm"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 text-fg-2 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={1.5}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </section>
  );
}
