/**
 * Inventory helpers shared between the storefront (gating the order button)
 * and the admin panel (status badges, dashboard counts). Stock tracking is
 * opt-in per product: `stockCount == null` means "not tracked" — the
 * product behaves exactly as it did before this feature existed, governed
 * only by the manual `inStock` flag. Setting a stock count in the admin
 * panel switches that product over to full reserve/confirm/release
 * bookkeeping (see src/lib/orders.ts).
 */

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "В наявності",
  low_stock: "Закінчується",
  out_of_stock: "Немає в наявності",
};

export const STOCK_STATUS_EMOJI: Record<StockStatus, string> = {
  in_stock: "🟢",
  low_stock: "🟡",
  out_of_stock: "🔴",
};

interface StockLike {
  stockCount?: number | null;
  stockReserved?: number | null;
}

/** Units actually available to sell right now (on hand minus reserved-but-unconfirmed orders). null = untracked (unlimited). */
export function computeAvailable(product: StockLike): number | null {
  if (product.stockCount === null || product.stockCount === undefined) return null;
  return Math.max(0, product.stockCount - (product.stockReserved ?? 0));
}

export function computeStockStatus(
  product: StockLike,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): StockStatus | null {
  const available = computeAvailable(product);
  if (available === null) return null;
  if (available <= 0) return "out_of_stock";
  if (available <= threshold) return "low_stock";
  return "in_stock";
}

/** Whether the "Order" / "Add to cart" actions should be enabled for this product. */
export function isAvailableForOrder(product: StockLike & { inStock: boolean }): boolean {
  if (!product.inStock) return false;
  const available = computeAvailable(product);
  if (available === null) return true; // untracked — manual inStock flag is the only gate
  return available > 0;
}
