import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { kits as demoKits } from "@/lib/data";
import { getKitBySlug } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { SITE_URL, localeTags } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";
import { Container } from "@/components/ui/Container";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { PriceTag } from "@/components/ui/PriceTag";
import { SpecsTable } from "@/components/product/SpecsTable";
import { ProductActions } from "@/components/product/ProductActions";

export function generateStaticParams() {
  return demoKits.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata(
  { params }: { params: { locale: Locale; slug: string } }
): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const kit = await getKitBySlug(params.slug);
  if (!kit) return { title: dict.notFound.title };

  const title = kit.name[params.locale];
  const description = kit.description[params.locale];
  const path = `/kits/${params.slug}`;
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

export default async function KitDetailPage({ params }: { params: { locale: Locale; slug: string } }) {
  const dict = getDictionary(params.locale);
  const locale = params.locale;
  const kit = await getKitBySlug(params.slug);
  if (!kit) {
    notFound();
    return null;
  }

  const name = kit.name[locale];

  return (
    <Container className="pt-4 sm:pt-8">
      <nav className="mb-4 flex items-center gap-2 text-[13px] text-fg-2 sm:mb-6" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-fg">
          {dict.header.home}
        </Link>
        <span className="text-fg-3" aria-hidden="true">/</span>
        <Link href="/kits" className="transition-colors hover:text-fg">
          {dict.categories.kits.title}
        </Link>
        <span className="hidden text-fg-3 sm:inline" aria-hidden="true">/</span>
        <span className="hidden text-fg sm:inline" aria-current="page">
          {name}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
        <ProductVisual
          category="kits"
          className="-mx-4 aspect-[4/3] sm:-mx-6 lg:col-span-7 lg:mx-0 lg:aspect-[5/4]"
        />

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[8.5rem]">
            <p className="caption text-fg-2">{dict.categories.kits.title}</p>
            <h1 className="mt-3 text-balance text-[28px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[40px]">
              {name}
            </h1>
            <p className="mt-3 text-fg-2 sm:text-lg">{kit.description[locale]}</p>

            <dl className="mt-6 grid grid-cols-2 border-t border-fg">
              <div className="border-b border-rule py-3 pr-4">
                <dt className="caption text-fg-3">{dict.specs.power}</dt>
                <dd className="num mt-1 text-lg font-semibold">
                  {kit.inverterKw} {dict.kits.inverterUnit}
                </dd>
              </div>
              <div className="border-b border-l border-rule py-3 pl-4">
                <dt className="caption text-fg-3">{dict.specs.capacity}</dt>
                <dd className="num mt-1 text-lg font-semibold">
                  {kit.batteryKwh} {dict.kits.batteryUnit}
                </dd>
              </div>
              <div className="col-span-2 border-b border-rule py-3">
                <dt className="caption text-fg-3">{dict.homeSolutions.autonomyLabel}</dt>
                <dd className="mt-1 font-medium">{kit.runtimeHours[locale]}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <PriceTag price={kit.price} oldPrice={kit.oldPrice} size="lg" />
            </div>

            <div className="mt-6">
              <ProductActions id={kit.id} slug={kit.slug} category="kits" name={kit.name} price={kit.price} />
            </div>

            <div className="mt-6 border-t border-rule pt-4">
              <p className="caption text-fg-2">{dict.kits.suitableFor}</p>
              <p className="mt-2 text-[15px]">{kit.suitableFor[locale].join(", ")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 sm:mt-20">
        <section className="grid grid-cols-1 gap-4 border-b border-t border-rule py-10 sm:py-14 lg:grid-cols-12 lg:gap-10">
          <h2 className="text-h3 font-semibold lg:col-span-3">{dict.product.tabSpecs}</h2>
          <div className="lg:col-span-9">
            <SpecsTable specs={kit.specs[locale]} />
          </div>
        </section>
        <section className="grid grid-cols-1 gap-4 py-10 sm:py-14 lg:grid-cols-12 lg:gap-10">
          <h2 className="text-h3 font-semibold lg:col-span-3">{dict.kits.included}</h2>
          <ul className="grid grid-cols-1 border-t border-rule md:grid-cols-2 md:gap-x-10 lg:col-span-9">
            {kit.whatsIncluded[locale].map((i) => (
              <li key={i} className="border-b border-rule py-3 text-[15px]">
                {i}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Container>
  );
}
