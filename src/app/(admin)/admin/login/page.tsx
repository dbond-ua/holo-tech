import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { LoginForm } from "./LoginForm";

const DEMO_EMAIL = process.env.ADMIN_DEMO_EMAIL || "admin@holotech.store";
const DEMO_PASSWORD = process.env.ADMIN_DEMO_PASSWORD || "holotech-demo";

export default function AdminLoginPage() {
  const session = getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
            T
          </div>
          <h1 className="text-lg font-semibold text-ink">HoloTech Admin</h1>
          <p className="mt-1 text-sm text-muted">Увійдіть, щоб керувати товарами та замовленнями</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-softer">
          <LoginForm />
        </div>

        {!IS_DB_CONFIGURED && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">
            Базу даних не налаштовано — доступний демо-вхід:
            <br />
            <span className="font-mono">{DEMO_EMAIL}</span> / <span className="font-mono">{DEMO_PASSWORD}</span>
          </div>
        )}
      </div>
    </div>
  );
}
