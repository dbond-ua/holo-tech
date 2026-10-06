import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { electronicsCategorySlugs } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { ProductDetailView } from "@/components/product/ProductDetailView";

/**
 * Product page for the electronics categories. Products come from the
 * database only, so nothing is prerendered at build time: each page is
 * rendered on first request and then served from the Next.js cache until
 * the next build.
 */
export function generateStaticParams() {
  return [];
}

function asCategory(value: string): CategorySlug | null {
  return (electronicsCategorySlugs as string[]).includes(value) ? (value as CategorySlug) : null;
}

export async function generateMetadata(
  { params }: { params: { locale: Locale; category: string; slug: string } }
): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const category = asCategory(params.category);
  const product = category ? await getProductBySlug(category, params.slug) : undefined;
  if (!category || !product) return { title: dict.notFound.title };

  const title = product.name[params.locale];
  const description = product.tagline[params.locale] || dict.categories[category].description;
  const path = `/${category}/${params.slug}`;
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

export default async function ElectronicsProductPage(
  { params }: { params: { locale: Locale; category: string; slug: string } }
) {
  const category = asCategory(params.category);
  const product = category ? await getProductBySlug(category, params.slug) : undefined;
  if (!category || !product) notFound();

  const related = await getRelatedProducts(category, product.id);
  return <ProductDetailView product={product} related={related} locale={params.locale} />;
}
