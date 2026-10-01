import type { BaseProduct } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionary.types";
import { computeAvailable, isAvailableForOrder } from "@/lib/stock";
import { discountPercent } from "@/lib/utils";

/**
 * Presentation helpers shared by product cards, list rows and the product
 * page. Pure functions — safe in server and client components.
 */

export type Availability =
  | { kind: "in_stock"; label: string }
  | { kind: "low"; label: string }
  | { kind: "on_order"; label: string }
  | { kind: "out"; label: string };

/** Storefront shows "only N left" below this many available units. */
const LOW_STOCK_DISPLAY_THRESHOLD = 5;

export function getAvailability(product: BaseProduct, dict: Dictionary): Availability {
  const orderable = isAvailableForOrder({
    inStock: product.inStock,
    stockCount: product.stockCount,
    stockReserved: product.stockReserved,
  });
  if (!orderable) return { kind: "out", label: dict.product.outOfStock };
  const available = computeAvailable(product);
  if (available !== null && available <= LOW_STOCK_DISPLAY_THRESHOLD) {
    return { kind: "low", label: dict.ui.lowStock(available) };
  }
  return { kind: "in_stock", label: dict.common.inStock };
}

/**
 * One badge per product, by priority: discount → new → bestseller.
 * Returns null when nothing is worth flagging.
 */
export function getPrimaryBadge(
  product: Pick<BaseProduct, "price" | "oldPrice" | "isNew" | "isBestseller">,
  dict: Dictionary
): { label: string; tone: "signal" | "neutral" | "quiet" } | null {
  const discount = discountPercent(product.price, product.oldPrice);
  if (discount) return { label: `−${discount}%`, tone: "signal" };
  if (product.isNew) return { label: dict.common.new, tone: "neutral" };
  if (product.isBestseller) return { label: dict.common.bestseller, tone: "quiet" };
  return null;
}

function formatThousands(value: number): string {
  return new Intl.NumberFormat("uk-UA").format(value);
}

/**
 * The 2–3 numbers a buyer compares within a category, as short strings:
 * stations "1800 Вт · 1024 Втг · LiFePO4", inverters "5000 Вт · гібридний",
 * batteries "51.2 В · 5.12 кВтг · 6000 циклів", panels "400 Вт".
 */
export function getSpecLine(product: BaseProduct, dict: Dictionary, max = 3): string[] {
  const { units, specs } = dict;
  const parts: string[] = [];

  switch (product.category) {
    case "batteries": {
      if (product.voltageV) parts.push(`${product.voltageV} ${units.v}`);
      if (product.capacityWh) parts.push(`${(product.capacityWh / 1000).toFixed(2)} ${units.kwh}`);
      else if (product.capacityAh) parts.push(`${product.capacityAh} ${units.ah}`);
      if (product.cycles) parts.push(`${formatThousands(product.cycles)} ${units.cycles}`);
      break;
    }
    case "inverters": {
      if (product.powerW) parts.push(`${formatThousands(product.powerW)} ${units.w}`);
      if (product.inverterType) {
        const map = { hybrid: specs.typeHybrid, grid: specs.typeGrid, "off-grid": specs.typeOffgrid };
        parts.push(map[product.inverterType].toLowerCase());
      }
      if (product.phase) parts.push(product.phase === "single" ? "1F" : "3F");
      break;
    }
    default: {
      if (product.powerW) parts.push(`${formatThousands(product.powerW)} ${units.w}`);
      if (product.capacityWh) parts.push(`${formatThousands(product.capacityWh)} ${units.wh}`);
      if (product.batteryType) parts.push(product.batteryType);
      else if (product.outlets) parts.push(`${product.outlets} ${units.outlets}`);
    }
  }

  return parts.slice(0, max);
}

/** Product URL, relative to the locale root. */
export function productHref(product: Pick<BaseProduct, "category" | "slug">): string {
  return `/${product.category}/${product.slug}`;
}
