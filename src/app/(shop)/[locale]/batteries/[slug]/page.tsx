import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { batteries as demoBatteries } from "@/lib/data";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { ProductDetailView } from "@/components/product/ProductDetailView";

export function generateStaticParams() {
  return demoBatteries.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: { locale: Locale; slug: string } }
): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const product = await getProductBySlug("batteries", params.slug);
  if (!product) return { title: dict.notFound.title };

  const title = product.name[params.locale];
  const description = product.tagline[params.locale];
  const path = `/batteries/${params.slug}`;
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

export default async function BatteryDetailPage({ params }: { params: { locale: Locale; slug: string } }) {
  const product = await getProductBySlug("batteries", params.slug);
  if (!product) {
    notFound();
    return null;
  }

  const related = await getRelatedProducts("batteries", product.id);

  return <ProductDetailView product={product} related={related} locale={params.locale} />;
}
