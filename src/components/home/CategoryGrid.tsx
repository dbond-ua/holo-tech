import { ArrowUpRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductVisual } from "@/components/ui/ProductVisual";
import type { Dictionary } from "@/i18n/dictionary.types";

export function CategoryGrid({ dict }: { dict: Dictionary }) {
  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={dict.home.categoriesEyebrow} title={dict.home.categoriesTitle} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface p-5 transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift dark:border-line-dark dark:bg-surface-dark"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{c.emoji}</span>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 dark:text-muted-dark" />
              </div>
              <div className="my-4 aspect-[5/4] w-full">
                <ProductVisual category={c.slug} seed={c.slug} className="h-full w-full" />
              </div>
              <p className="text-sm font-semibold">{c.title}</p>
              <p className="mt-1 text-xs text-muted dark:text-muted-dark">{c.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
