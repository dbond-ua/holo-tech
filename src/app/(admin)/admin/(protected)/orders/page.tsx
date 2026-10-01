import Link from "next/link";
import { listOrders } from "@/lib/admin/orders";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { formatUAH, cn } from "@/lib/utils";
import { formatUaPhoneDisplay } from "@/lib/phone";
import { DbBanner } from "../../components/DbBanner";
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "../../components/StatusBadge";
import type { OrderStatus } from "@/lib/db/types";

const STATUSES: OrderStatus[] = ["new", "called", "contacted", "postponed", "confirmed", "cancelled"];

function isOrderStatus(value: string): value is OrderStatus {
  return (STATUSES as string[]).includes(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const activeStatus = searchParams.status && isOrderStatus(searchParams.status) ? searchParams.status : undefined;
  const orders = await listOrders(activeStatus ? { status: activeStatus } : undefined);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Замовлення</h1>
      <p className="mt-1 text-sm text-muted">{orders.length} замовлення(нь)</p>

      {!IS_DB_CONFIGURED && (
        <div className="mt-6">
          <DbBanner />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium",
            !activeStatus ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"
          )}
        >
          Всі
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              activeStatus === status ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"
            )}
          >
            {ORDER_STATUS_LABELS[status]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">№</th>
              <th className="px-4 py-3 font-medium">Клієнт</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Сума</th>
              <th className="px-4 py-3 font-medium">Створено</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{order.order_number}</td>
                <td className="px-4 py-3 text-ink">{order.name}</td>
                <td className="px-4 py-3 text-muted">{formatUaPhoneDisplay(order.phone)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 font-medium text-ink">{formatUAH(order.total)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-accent hover:underline">
                    Деталі
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  Замовлень не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
