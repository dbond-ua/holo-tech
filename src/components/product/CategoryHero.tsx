import { ChevronRight } from "lucide-react";
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
    <div className="border-b border-line py-8 sm:py-12 dark:border-line-dark">
      <Container>
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
            {dict.header.home}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink dark:text-ink-dark">{category.title}</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.emoji}</span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{category.title}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted dark:text-muted-dark">{category.description}</p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">{dict.catalog.productsCount(count)}</p>
      </Container>
    </div>
  );
}
