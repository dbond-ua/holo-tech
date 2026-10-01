import { listCategories } from "@/lib/admin/products";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { DbBanner } from "../../components/DbBanner";
import { CategoryRowForm } from "./CategoryRowForm";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Категорії</h1>
      <p className="mt-1 text-sm text-muted">
        Категорії створюються через migrations/0006_demo_seed.sql — тут можна редагувати лише переклади та порядок.
      </p>

      {!IS_DB_CONFIGURED && (
        <div className="mt-6">
          <DbBanner />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {categories.map((category) => (
          <CategoryRowForm key={category.id} category={category} />
        ))}
        {categories.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-muted">
            Категорій ще немає.
          </p>
        )}
      </div>
    </div>
  );
}
