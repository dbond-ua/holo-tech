import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByCategory } from "@/lib/catalog";
import { electronicsCategorySlugs } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { CategoryHero } from "@/components/product/CategoryHero";
import { CatalogClient } from "@/components/product/CatalogClient";
import { Container } from "@/components/ui/Container";

/**
 * Generic catalog page for the electronics categories (supplier import).
 * The original energy categories keep their own folders (/stations, ...),
 * which Next.js matches before this dynamic segment. Anything that is not
 * one of electronicsCategorySlugs is a 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return electronicsCategorySlugs.map((category) => ({ category }));
}

function asCategory(value: string): CategorySlug | null {
  return (electronicsCategorySlugs as string[]).includes(value) ? (value as CategorySlug) : null;
}

export async function generateMetadata(
  { params }: { params: { locale: Locale; category: string } }
): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const slug = asCategory(params.category);
  if (!slug) return { title: dict.notFound.title };
  const { title, description } = dict.categories[slug];
  const path = `/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${localePath(params.locale, path)}`,
      languages: {
        "uk-UA": `${SITE_URL}${localePath("uk", path)}`,
        en: `${SITE_URL}${localePath("en", path)}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: localeTags[params.locale],
      url: `${SITE_URL}${localePath(params.locale, path)}`,
    },
  };
}

export default async function ElectronicsCategoryPage({ params }: { params: { locale: Locale; category: string } }) {
  const slug = asCategory(params.category);
  if (!slug) notFound();
  const dict = getDictionary(params.locale);
  const products = await getProductsByCategory(slug);
  const category = { slug, ...dict.categories[slug] };
  return (
    <>
      <CategoryHero category={category} count={products.length} dict={dict} />
      <Container className="pb-8">
        <CatalogClient category={slug} products={products} />
      </Container>
    </>
  );
}
