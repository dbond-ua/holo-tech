"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { BaseProduct } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

export function RelatedProducts({ products }: { products: BaseProduct[] }) {
  const { dict } = useI18n();
  if (products.length === 0) return null;
  return (
    <section className="pt-16 sm:pt-24">
      <SectionHeading eyebrow={dict.product.relatedEyebrow} title={dict.product.relatedTitle} />
      <ProductGrid products={products} columns="wide" className="mt-8 sm:mt-10" />
    </section>
  );
}
