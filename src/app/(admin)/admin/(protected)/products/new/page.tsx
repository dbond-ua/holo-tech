import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategories, listBrands } from "@/lib/admin/products";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([listCategories(), listBrands()]);

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        До списку товарів
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-ink">Новий товар</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
