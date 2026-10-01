import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProduct, listCategories, listBrands, listStockAdjustments } from "@/lib/admin/products";
import { ProductForm } from "../ProductForm";
import { StockHistory } from "../StockHistory";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories, brands] = await Promise.all([
    getProduct(params.id),
    listCategories(),
    listBrands(),
  ]);

  if (!product) notFound();

  const adjustments = await listStockAdjustments(product.id);

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        До списку товарів
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-ink">Редагування: {product.name_uk}</h1>
      <div className="space-y-6">
        <ProductForm product={product} categories={categories} brands={brands} />
        <StockHistory
          stockCount={product.stock_count}
          stockReserved={product.stock_reserved}
          lowStockThreshold={product.low_stock_threshold}
          adjustments={adjustments}
        />
      </div>
    </div>
  );
}
