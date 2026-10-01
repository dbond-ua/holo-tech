import Link from "next/link";
import { computeAvailable, computeStockStatus, STOCK_STATUS_EMOJI, STOCK_STATUS_LABELS } from "@/lib/stock";
import type { StockAdjustmentRow } from "@/lib/db/types";

const REASON_LABELS: Record<StockAdjustmentRow["reason"], string> = {
  order_reserved: "Резерв під замовлення",
  order_confirmed: "Списано (замовлення підтверджено)",
  order_cancelled: "Резерв повернуто (скасовано)",
  order_restocked: "Повернено на склад (скасовано підтверджене)",
  manual: "Ручна зміна",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDelta(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Current stock status + a recent-changes log for the product edit page.
 *  Only rendered when the product actually has stock tracking enabled
 *  (stock_count is not null) — otherwise there's nothing to show yet, since
 *  the field is empty until the admin sets an initial quantity. */
export function StockHistory({
  stockCount,
  stockReserved,
  lowStockThreshold,
  adjustments,
}: {
  stockCount: number | null;
  stockReserved: number;
  lowStockThreshold: number | null;
  adjustments: StockAdjustmentRow[];
}) {
  if (stockCount === null) {
    return (
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Облік залишків</h2>
        <p className="mt-2 text-sm text-muted">
          Для цього товару облік складу не увімкнено — введіть «Кількість на складі» вище та збережіть, щоб почати
          відстежувати залишок і резерви автоматично.
        </p>
      </section>
    );
  }

  const status = computeStockStatus({ stockCount, stockReserved }, lowStockThreshold ?? undefined);
  const available = computeAvailable({ stockCount, stockReserved });

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Облік залишків</h2>
        {status && (
          <span className="text-sm font-medium text-ink">
            {STOCK_STATUS_EMOJI[status]} {STOCK_STATUS_LABELS[status]}
          </span>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted">На складі</dt>
          <dd className="text-lg font-semibold text-ink">{stockCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">У резерві</dt>
          <dd className="text-lg font-semibold text-ink">{stockReserved}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Доступно до продажу</dt>
          <dd className="text-lg font-semibold text-ink">{available}</dd>
        </div>
      </dl>

      <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Історія змін</h3>
      {adjustments.length === 0 ? (
        <p className="text-sm text-muted">Змін ще не було.</p>
      ) : (
        <ol className="space-y-3">
          {adjustments.map((a) => (
            <li key={a.id} className="border-b border-line pb-3 text-sm last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink">
                  {REASON_LABELS[a.reason]}
                  {a.stock_delta !== 0 && <span className="ml-2 text-muted">{formatDelta(a.stock_delta)} шт.</span>}
                  {a.reserved_delta !== 0 && (
                    <span className="ml-2 text-muted">резерв {formatDelta(a.reserved_delta)}</span>
                  )}
                </span>
                <span className="text-xs text-muted">{formatDate(a.created_at)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                → залишок {a.resulting_stock_count ?? "—"} шт.
                {a.manager_name ? ` · ${a.manager_name}` : ""}
                {a.order_id && (
                  <>
                    {" · "}
                    <Link href={`/admin/orders/${a.order_id}`} className="text-accent hover:underline">
                      замовлення
                    </Link>
                  </>
                )}
              </p>
              {a.note && <p className="mt-0.5 text-xs text-muted">{a.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
