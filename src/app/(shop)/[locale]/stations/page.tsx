import type { Metadata } from "next";
import { getProductsByCategory } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { CategoryHero } from "@/components/product/CategoryHero";
import { CatalogClient } from "@/components/product/CatalogClient";
import { Container } from "@/components/ui/Container";

export async function generateMetadata(
  { params }: { params: { locale: Locale } }
): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title = dict.categories.stations.title;
  const description = dict.categories.stations.description;
  const path = "/stations";
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

export default async function StationsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const products = await getProductsByCategory("stations");
  const category = { slug: "stations" as const, ...dict.categories.stations };
  return (
    <>
      <CategoryHero category={category} count={products.length} dict={dict} />
      <Container className="py-8 sm:py-10">
        <CatalogClient category="stations" products={products} />
      </Container>
    </>
  );
}
