import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderDetail } from "@/lib/admin/orders";
import { formatUAH } from "@/lib/utils";
import { formatUaPhoneDisplay } from "@/lib/phone";
import { setOrderStatusAction } from "../../../actions";
import { SubmitButton } from "../../../components/SubmitButton";
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "../../../components/StatusBadge";
import type { DeliveryMethod } from "@/lib/db/types";

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  np_warehouse: "Нова Пошта — відділення",
  np_poshtomat: "Нова Пошта — поштомат",
  courier: "Кур'єр",
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

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const detail = await getOrderDetail(params.id);
  if (!detail) notFound();
  const { order, items, history } = detail;

  const hasUtm = order.utm_source || order.utm_medium || order.utm_campaign || order.utm_content || order.utm_term;

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        До списку замовлень
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Замовлення {order.order_number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">Створено {formatDate(order.created_at)}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <form action={setOrderStatusAction.bind(null, order.id, "called")}>
          <SubmitButton variant="secondary">Подзвонив</SubmitButton>
        </form>
        <form action={setOrderStatusAction.bind(null, order.id, "contacted")}>
          <SubmitButton variant="secondary">Зв&apos;язався</SubmitButton>
        </form>
        <form action={setOrderStatusAction.bind(null, order.id, "postponed")}>
          <SubmitButton variant="secondary">Передзвонити пізніше</SubmitButton>
        </form>
        <form action={setOrderStatusAction.bind(null, order.id, "confirmed")}>
          <SubmitButton className="bg-green-600 hover:bg-green-700">Підтвердити</SubmitButton>
        </form>
        <form action={setOrderStatusAction.bind(null, order.id, "cancelled")}>
          <SubmitButton variant="danger">Скасувати</SubmitButton>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Контактні дані</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Ім&apos;я</dt>
                <dd className="text-ink">{order.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Телефон</dt>
                <dd className="text-ink">{formatUaPhoneDisplay(order.phone)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Місто</dt>
                <dd className="text-ink">{order.city ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Спосіб доставки</dt>
                <dd className="text-ink">{DELIVERY_LABELS[order.delivery_method]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Мова замовлення</dt>
                <dd className="text-ink">{order.language === "en" ? "English" : order.language === "uk" ? "Українська" : "—"}</dd>
              </div>
              {order.delivery_method !== "courier" && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Відділення / поштомат</dt>
                  <dd className="text-ink">{order.np_warehouse_name ?? "—"}</dd>
                </div>
              )}
              {order.delivery_method === "courier" && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Адреса</dt>
                  <dd className="text-ink">{order.courier_address ?? "—"}</dd>
                </div>
              )}
              {order.comment && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Коментар</dt>
                  <dd className="text-ink">{order.comment}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Товари</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 font-medium">Назва</th>
                    <th className="py-2 font-medium">К-сть</th>
                    <th className="py-2 font-medium">Ціна</th>
                    <th className="py-2 text-right font-medium">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-b-0">
                      <td className="py-2 text-ink">{item.name_uk}</td>
                      <td className="py-2 text-muted">{item.qty}</td>
                      <td className="py-2 text-muted">{formatUAH(item.price)}</td>
                      <td className="py-2 text-right font-medium text-ink">{formatUAH(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end gap-6 text-sm">
              <div className="text-muted">
                Разом: <span className="font-medium text-ink">{formatUAH(order.subtotal)}</span>
              </div>
              <div className="text-muted">
                До сплати: <span className="font-semibold text-ink">{formatUAH(order.total)}</span>
              </div>
            </div>
          </section>

          {hasUtm && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink">UTM-мітки</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">Source</dt>
                  <dd className="text-ink">{order.utm_source ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Medium</dt>
                  <dd className="text-ink">{order.utm_medium ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Campaign</dt>
                  <dd className="text-ink">{order.utm_campaign ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Content</dt>
                  <dd className="text-ink">{order.utm_content ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Term</dt>
                  <dd className="text-ink">{order.utm_term ?? "—"}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">Історія статусів</h2>
          <ol className="space-y-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative border-l border-line pl-4">
                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-ink" />
                <p className="text-sm text-ink">
                  {entry.from_status ? `${ORDER_STATUS_LABELS[entry.from_status]} → ` : ""}
                  <span className="font-medium">{ORDER_STATUS_LABELS[entry.to_status]}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDate(entry.created_at)}
                  {entry.manager_name ? ` · ${entry.manager_name}` : ""} · {entry.source}
                </p>
                {entry.note && <p className="mt-1 text-xs text-muted">{entry.note}</p>}
              </li>
            ))}
            {history.length === 0 && <p className="text-sm text-muted">Історії ще немає.</p>}
          </ol>
        </section>
      </div>
    </div>
  );
}
