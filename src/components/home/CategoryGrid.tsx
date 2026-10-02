import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductVisual } from "@/components/ui/ProductVisual";
import type { Dictionary } from "@/i18n/dictionary.types";
import { cn } from "@/lib/utils";

/**
 * Category mosaic: stations get a 6×2 cell (they are the core of the
 * range), four categories take 3×1 cells, accessories close the block as a
 * slim full-width row. Cells share hairline edges — one sheet, not six cards.
 */
export function CategoryGrid({ dict, counts }: { dict: Dictionary; counts: Partial<Record<CategorySlug, number>> }) {
  const categories = categorySlugs.map((slug, i) => ({ slug, index: i + 1, ...dict.categories[slug] }));
  const [lead, ...rest] = categories.filter((c) => c.slug !== "accessories");
  const accessories = categories.find((c) => c.slug === "accessories");

  const count = (slug: CategorySlug) =>
    typeof counts[slug] === "number" && counts[slug]! > 0 ? dict.ui.modelsCount(counts[slug]!) : null;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading index="01" eyebrow={dict.home.categoriesEyebrow} title={dict.home.categoriesTitle} />

        <div className="mt-8 grid grid-cols-2 border-l border-t border-rule sm:mt-12 lg:grid-cols-12">
          <Link
            href={`/${lead.slug}`}
            className="group col-span-2 flex flex-col border-b border-r border-rule bg-paper lg:col-span-6 lg:row-span-2"
          >
            <div className="flex items-start justify-between p-5 sm:p-7">
              <div>
                <p className="caption text-fg-3">{String(lead.index).padStart(2, "0")}</p>
                <h3 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">
                  {lead.title}
                </h3>
                <p className="mt-2 max-w-xs text-fg-2">{lead.description}</p>
              </div>
              {count(lead.slug) && <p className="spec shrink-0 text-fg-2">{count(lead.slug)}</p>}
            </div>
            <ProductVisual
              category={lead.slug}
              className="mx-5 mb-5 aspect-[16/10] flex-1 transition-colors duration-200 group-hover:bg-fg/[0.09] sm:mx-7 sm:mb-7"
            />
          </Link>

          {rest.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group flex flex-col border-b border-r border-rule bg-paper p-4 sm:p-5 lg:col-span-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="caption text-fg-3">{String(c.index).padStart(2, "0")}</p>
                <ArrowUpRight
                  className="h-4 w-4 text-fg-3 transition-colors group-hover:text-fg"
                  strokeWidth={1.5}
                />
              </div>
              <ProductVisual
                category={c.slug}
                compact
                className="my-4 aspect-[4/3] transition-colors duration-200 group-hover:bg-fg/[0.09]"
              />
              <h3 className="text-[15px] font-semibold leading-snug sm:text-base">{c.title}</h3>
              <p className="mt-1 hidden text-sm text-fg-2 sm:block">{c.description}</p>
              {count(c.slug) && <p className="spec mt-2 text-fg-2">{count(c.slug)}</p>}
            </Link>
          ))}

          {accessories && (
            <Link
              href={`/${accessories.slug}`}
              className={cn(
                "group col-span-2 flex items-center gap-4 border-b border-r border-rule bg-paper px-5 py-4 sm:px-7 sm:py-5 lg:col-span-12"
              )}
            >
              <p className="caption text-fg-3">{String(accessories.index).padStart(2, "0")}</p>
              <h3 className="text-base font-semibold sm:text-lg">{accessories.title}</h3>
              <p className="hidden flex-1 text-fg-2 md:block">{accessories.description}</p>
              <span className="flex-1 md:hidden" />
              {count(accessories.slug) && <p className="spec hidden text-fg-2 sm:block">{count(accessories.slug)}</p>}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
