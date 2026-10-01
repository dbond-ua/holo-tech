import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-semibold text-ink">404</p>
      <p className="text-sm text-muted">Сторінку або запис не знайдено.</p>
      <Link href="/admin" className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
        На дашборд
      </Link>
    </div>
  );
}
