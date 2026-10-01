import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, Tags, Award, ClipboardList, LogOut } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { logoutAction } from "../actions";
import { SubmitButton } from "../components/SubmitButton";

const NAV_LINKS = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/products", label: "Товари", icon: Package },
  { href: "/admin/categories", label: "Категорії", icon: Tags },
  { href: "/admin/brands", label: "Бренди", icon: Award },
  { href: "/admin/orders", label: "Замовлення", icon: ClipboardList },
];

export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-line bg-white lg:h-screen lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
            T
          </div>
          <span className="text-sm font-semibold text-ink">HoloTech Admin</span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line px-3 py-3 lg:mt-auto">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-ink">{session.name}</p>
            <p className="truncate text-xs text-muted">{session.email}</p>
          </div>
          <form action={logoutAction}>
            <SubmitButton variant="secondary" className="w-full" pendingText="Вихід…">
              <LogOut className="h-3.5 w-3.5" />
              Вийти
            </SubmitButton>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
