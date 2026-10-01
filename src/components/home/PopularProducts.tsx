import { ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { getPopularProducts } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Dictionary } from "@/i18n/dictionary.types";

export async function PopularProducts({ dict }: { dict: Dictionary }) {
  const popularProducts = await getPopularProducts();
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={dict.home.popularEyebrow}
          title={dict.home.popularTitle}
          description={dict.home.popularDescription}
          action={
            <Link
              href="/stations"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
            >
              {dict.common.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <ProductGrid products={popularProducts} className="mt-8" />
      </Container>
    </section>
  );
}
