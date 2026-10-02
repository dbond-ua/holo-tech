import { ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { getPopularProducts } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import type { Dictionary } from "@/i18n/dictionary.types";

/**
 * Editorial showcase: one product at feature scale (6 cols, two rows) beside
 * four regular cells. The list itself is whatever the admin marks
 * "show on homepage" (or the demo selection) — it can mix categories, so the
 * section title no longer claims they are all stations.
 */
export async function PopularProducts({ dict }: { dict: Dictionary }) {
  const products = await getPopularProducts();
  if (products.length === 0) return null;

  const [lead, ...others] = products;
  const side = others.slice(0, 4);

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          index="03"
          eyebrow={dict.ui.picksEyebrow}
          title={dict.ui.picksTitle}
          description={dict.ui.picksDescription}
          action={
            <Link
              href="/stations"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline"
            >
              {dict.common.viewAll} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          }
        />

        <ul className="mt-8 grid grid-cols-2 border-l border-t border-rule sm:mt-12 lg:grid-cols-12">
          <li className="col-span-2 flex border-b border-r border-rule lg:col-span-6 lg:row-span-2">
            <ProductCard product={lead} variant="feature" className="w-full" priority />
          </li>
          {side.map((p) => (
            <li key={p.id} className="flex border-b border-r border-rule lg:col-span-3">
              <ProductCard product={p} className="w-full" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
