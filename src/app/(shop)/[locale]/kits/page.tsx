import type { Metadata } from "next";
import { getKits } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { CategoryHero } from "@/components/product/CategoryHero";
import { Container } from "@/components/ui/Container";
import { KitCell } from "@/components/home/KitsShowcase";

export async function generateMetadata(
  { params }: { params: { locale: Locale } }
): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title = dict.categories.kits.title;
  const description = dict.categories.kits.description;
  const path = "/kits";
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

export default async function KitsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const locale = params.locale;
  const category = { slug: "kits" as const, ...dict.categories.kits };
  const kits = await getKits();
  return (
    <>
      <CategoryHero category={category} count={kits.length} dict={dict} />
      <Container className="pb-8">
        <ul className="grid grid-cols-1 border-l border-t border-rule md:grid-cols-3">
          {kits.map((k) => (
            <li key={k.id} className="border-b border-r border-rule">
              <KitCell kit={k} dict={dict} locale={locale} withDescription />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
