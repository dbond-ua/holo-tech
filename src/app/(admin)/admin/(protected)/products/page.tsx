import Link from "next/link";
import { Plus, Pencil, ImageOff, EyeOff, Eye } from "lucide-react";
import { listProducts } from "@/lib/admin/products";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { formatUAH } from "@/lib/utils";
import { computeAvailable, computeStockStatus, STOCK_STATUS_EMOJI, STOCK_STATUS_LABELS } from "@/lib/stock";
import { deleteProductAction, toggleProductPublishedAction } from "../../actions";
import { ConfirmDeleteButton } from "../../components/ConfirmDeleteButton";
import { SubmitButton } from "../../components/SubmitButton";
import { Badge } from "../../components/StatusBadge";
import { DbBanner } from "../../components/DbBanner";

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Товари</h1>
          <p className="mt-1 text-sm text-muted">{products.length} товар(ів)</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" />
          Новий товар
        </Link>
      </div>

      {!IS_DB_CONFIGURED && (
        <div className="mt-6">
          <DbBanner />
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Фото</th>
              <th className="px-4 py-3 font-medium">Назва</th>
              <th className="px-4 py-3 font-medium">Категорія</th>
              <th className="px-4 py-3 font-medium">Бренд</th>
              <th className="px-4 py-3 font-medium">Ціна</th>
              <th className="px-4 py-3 font-medium">Залишок</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockStatus = computeStockStatus(
                { stockCount: product.stock_count, stockReserved: product.stock_reserved },
                product.low_stock_threshold ?? undefined
              );
              const available = computeAvailable({
                stockCount: product.stock_count,
                stockReserved: product.stock_reserved,
              });
              return (
                <tr key={product.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt=""
                        className="h-12 w-12 rounded-lg border border-line object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-line text-muted">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{product.name_uk}</p>
                    <p className="text-xs text-muted">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{product.category?.title_uk ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{product.brand?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-ink">{formatUAH(product.price)}</td>
                  <td className="px-4 py-3">
                    {stockStatus === null ? (
                      <span className="text-xs text-muted">не відстежується</span>
                    ) : (
                      <span className="whitespace-nowrap text-xs text-ink">
                        {STOCK_STATUS_EMOJI[stockStatus]} {available} шт.
                        <span className="block text-muted">{STOCK_STATUS_LABELS[stockStatus]}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {product.is_published ? (
                        <Badge tone="positive">Опубліковано</Badge>
                      ) : (
                        <Badge tone="muted">Чернетка</Badge>
                      )}
                      {product.show_on_homepage && <Badge>На головній</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleProductPublishedAction.bind(null, product.id, !product.is_published)}>
                        <SubmitButton
                          variant="secondary"
                          className="h-8 px-2.5 text-xs"
                          pendingText="…"
                        >
                          {product.is_published ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Приховати
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Показати
                            </>
                          )}
                        </SubmitButton>
                      </form>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-ink"
                        aria-label="Редагувати"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <ConfirmDeleteButton
                        action={deleteProductAction.bind(null, product.id)}
                        className="h-8 px-2.5 text-xs"
                        confirmText={`Видалити товар «${product.name_uk}»?`}
                      >
                        Видалити
                      </ConfirmDeleteButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                  Товарів ще немає.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
