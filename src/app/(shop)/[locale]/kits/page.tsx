import type { Metadata } from "next";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { PlugZap, BatteryFull, Clock } from "lucide-react";
import { getKits } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { CategoryHero } from "@/components/product/CategoryHero";
import { Container } from "@/components/ui/Container";
import { PriceTag } from "@/components/ui/PriceTag";
import { ProductVisual } from "@/components/ui/ProductVisual";

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
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {kits.map((k) => (
            <Link
              key={k.id}
              href={`/kits/${k.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift dark:border-line-dark dark:bg-surface-dark"
            >
              <div className="aspect-[16/10] p-6">
                <ProductVisual category="kits" seed={k.id} className="h-full w-full" />
              </div>
              <div className="flex flex-1 flex-col p-6 pt-0">
                <p className="text-lg font-semibold">{k.name[locale]}</p>
                <p className="mt-2 text-sm text-muted dark:text-muted-dark">{k.description[locale]}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted dark:text-muted-dark">
                  <span className="inline-flex items-center gap-1.5">
                    <PlugZap className="h-4 w-4" /> {k.inverterKw} {dict.kits.inverterUnit}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BatteryFull className="h-4 w-4" /> {k.batteryKwh} {dict.kits.batteryUnit}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {k.runtimeHours[locale]}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {k.suitableFor[locale].slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs text-muted dark:bg-white/[0.08] dark:text-muted-dark"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <PriceTag price={k.price} oldPrice={k.oldPrice} size="md" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
