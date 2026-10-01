import Link from "next/link";
import { Package, Tags, Award, ClipboardList, ArrowRight } from "lucide-react";
import { countOrdersByStatus } from "@/lib/admin/orders";
import { countProductsByStockStatus } from "@/lib/admin/products";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { DbBanner } from "../components/DbBanner";
import { ORDER_STATUS_LABELS } from "../components/StatusBadge";
import type { OrderStatus } from "@/lib/db/types";

const STATUS_ORDER: OrderStatus[] = ["new", "called", "contacted", "postponed", "confirmed", "cancelled"];

const QUICK_LINKS = [
  { href: "/admin/products", label: "Товари", icon: Package },
  { href: "/admin/categories", label: "Категорії", icon: Tags },
  { href: "/admin/brands", label: "Бренди", icon: Award },
  { href: "/admin/orders", label: "Замовлення", icon: ClipboardList },
];

export default async function AdminDashboardPage() {
  const [counts, stock] = await Promise.all([countOrdersByStatus(), countProductsByStockStatus()]);
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Дашборд</h1>
      <p className="mt-1 text-sm text-muted">Загальний стан замовлень і товарів та швидкі переходи до розділів панелі.</p>

      {!IS_DB_CONFIGURED && (
        <div className="mt-6">
          <DbBanner />
        </div>
      )}

      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Замовлення</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/admin/orders"
          className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
        >
          <p className="text-2xl font-semibold text-ink">{total}</p>
          <p className="mt-0.5 text-sm text-muted">Всі замовлення</p>
        </Link>
        {STATUS_ORDER.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
          >
            <p className="text-2xl font-semibold text-ink">{counts[status]}</p>
            <p className="mt-0.5 text-sm text-muted">{ORDER_STATUS_LABELS[status]}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Товари</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/admin/products"
          className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
        >
          <p className="text-2xl font-semibold text-ink">{stock.total}</p>
          <p className="mt-0.5 text-sm text-muted">Всього товарів</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
        >
          <p className="text-2xl font-semibold text-ink">🟢 {stock.inStock}</p>
          <p className="mt-0.5 text-sm text-muted">В наявності</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
        >
          <p className="text-2xl font-semibold text-ink">🟡 {stock.lowStock}</p>
          <p className="mt-0.5 text-sm text-muted">Закінчується</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
        >
          <p className="text-2xl font-semibold text-ink">🔴 {stock.outOfStock}</p>
          <p className="mt-0.5 text-sm text-muted">Немає в наявності</p>
        </Link>
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted">Розділи</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
          >
            <span className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted" />
              <span className="text-sm font-medium text-ink">{label}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
