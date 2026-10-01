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
  const title = dict.categories["solar-panels"].title;
  const description = dict.categories["solar-panels"].description;
  const path = "/solar-panels";
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

export default async function SolarPanelsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const products = await getProductsByCategory("solar-panels");
  const category = { slug: "solar-panels" as const, ...dict.categories["solar-panels"] };
  return (
    <>
      <CategoryHero category={category} count={products.length} dict={dict} />
      <Container className="pb-8">
        <CatalogClient category="solar-panels" products={products} />
      </Container>
    </>
  );
}
