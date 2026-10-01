import { listBrands } from "@/lib/admin/products";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { deleteBrandAction } from "../../actions";
import { DbBanner } from "../../components/DbBanner";
import { ConfirmDeleteButton } from "../../components/ConfirmDeleteButton";
import { BrandForm } from "./BrandForm";

export default async function AdminBrandsPage() {
  const brands = await listBrands();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Бренди</h1>
      <p className="mt-1 text-sm text-muted">{brands.length} бренд(ів)</p>

      {!IS_DB_CONFIGURED && (
        <div className="mt-6">
          <DbBanner />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <BrandForm />
      </div>

      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
        {brands.map((brand) => (
          <div key={brand.id} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-medium text-ink">{brand.name}</span>
            <ConfirmDeleteButton
              action={deleteBrandAction.bind(null, brand.id)}
              className="h-8 px-2.5 text-xs"
              confirmText={`Видалити бренд «${brand.name}»?`}
            >
              Видалити
            </ConfirmDeleteButton>
          </div>
        ))}
        {brands.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">Брендів ще немає.</p>}
      </div>
    </div>
  );
}
