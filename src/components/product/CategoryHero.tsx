import { LocalizedLink as Link } from "@/components/LocalizedLink";
import type { CategorySlug } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionary.types";
import { Container } from "@/components/ui/Container";

interface CategoryHeroInfo {
  slug: CategorySlug;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
}

/** Compact catalog header: breadcrumbs, title with a mono count, one line of description. */
export function CategoryHero({
  category,
  count,
  dict,
}: {
  category: CategoryHeroInfo;
  count: number;
  dict: Dictionary;
}) {
  return (
    <div className="pb-6 pt-6 sm:pb-10 sm:pt-10">
      <Container>
        <nav className="flex items-center gap-2 text-[13px] text-fg-2" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-fg">
            {dict.header.home}
          </Link>
          <span className="text-fg-3" aria-hidden="true">/</span>
          <span className="text-fg" aria-current="page">
            {category.title}
          </span>
        </nav>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:mt-6">
          <h1 className="text-[34px] font-semibold leading-none tracking-[-0.03em] sm:text-h1">{category.title}</h1>
          <span className="spec text-fg-2">{dict.ui.productsCount(count)}</span>
        </div>
        <p className="mt-3 max-w-2xl text-fg-2 sm:mt-4 sm:text-lg">{category.description}</p>
      </Container>
    </div>
  );
}
