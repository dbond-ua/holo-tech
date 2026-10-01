import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ChevronRight, Check } from "lucide-react";
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
    <Container className="py-6 sm:py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
          {dict.header.home}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/kits" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
          {dict.categories.kits.title}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink dark:text-ink-dark">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square overflow-hidden rounded-xl3 border border-line p-10 dark:border-line-dark">
          <ProductVisual category="kits" seed={kit.id} className="h-full w-full" />
        </div>

        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
          <p className="mt-2 text-muted dark:text-muted-dark">{kit.description[locale]}</p>

          <div className="mt-6">
            <PriceTag price={kit.price} oldPrice={kit.oldPrice} size="lg" />
          </div>

          <div className="mt-6">
            <ProductActions
              id={kit.id}
              slug={kit.slug}
              category="kits"
              name={kit.name}
              price={kit.price}
            />
          </div>

          <div className="mt-8 border-t border-line pt-6 dark:border-line-dark">
            <p className="mb-3 text-sm font-semibold">{dict.kits.suitableFor}</p>
            <ul className="flex flex-col gap-2">
              {kit.suitableFor[locale].map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm text-muted dark:text-muted-dark">
                  <Check className="h-4 w-4 shrink-0 text-volt-600 dark:text-volt" /> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">{dict.product.tabSpecs}</h2>
          <SpecsTable specs={kit.specs[locale]} />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">{dict.kits.included}</h2>
          <ul className="flex flex-col gap-2.5">
            {kit.whatsIncluded[locale].map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted dark:text-muted-dark">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink dark:bg-ink-dark" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
