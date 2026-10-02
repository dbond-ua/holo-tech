import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { SITE_URL, localeTags } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { localePath } from "@/i18n/localePath";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { PopularProducts } from "@/components/home/PopularProducts";
import { QuizTeaser } from "@/components/home/QuizTeaser";
import { HomeSolutions } from "@/components/home/HomeSolutions";
import { KitsShowcase } from "@/components/home/KitsShowcase";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { WhyUs } from "@/components/home/WhyUs";
import { getAllProducts, getKits, getProductBySlug } from "@/lib/catalog";
import { categorySlugs } from "@/lib/data";
import type { BaseProduct, CategorySlug } from "@/lib/types";

/** Hero product: the newest station (most capable first), else the demo flagship. */
async function getHeroProduct(all: BaseProduct[]): Promise<BaseProduct | undefined> {
  const stations = all.filter((p) => p.category === "stations" && p.inStock);
  const newest = stations
    .filter((p) => p.isNew)
    .sort((a, b) => (b.capacityWh ?? 0) - (a.capacityWh ?? 0))[0];
  return newest ?? (await getProductBySlug("stations", "ecoflow-delta-pro-3")) ?? stations[0];
}

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title = dict.meta.defaultTitle;
  const description = dict.meta.defaultDescription;
  const path = "";
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

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const locale = params.locale;
  const [all, kits] = await Promise.all([getAllProducts(), getKits()]);
  const hero = await getHeroProduct(all);

  const counts: Partial<Record<CategorySlug, number>> = {};
  for (const slug of categorySlugs) {
    counts[slug] = slug === "kits" ? kits.length : all.filter((p) => p.category === slug).length;
  }

  return (
    <>
      <Hero dict={dict} locale={locale} product={hero} />
      <CategoryGrid dict={dict} counts={counts} />
      <QuizTeaser dict={dict} />
      <PopularProducts dict={dict} />
      <HomeSolutions dict={dict} locale={locale} />
      <KitsShowcase dict={dict} locale={locale} />
      <BrandsMarquee dict={dict} />
      <WhyUs dict={dict} />
    </>
  );
}
