import { ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductVisual";
import { PriceTag } from "@/components/ui/PriceTag";
import type { BaseProduct } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionary.types";
import type { Locale } from "@/i18n/config";
import { productHref } from "@/lib/product-ui";

/**
 * Hero = statement + one product on stage.
 * Row 1: the brand line set large, the store description and the station
 * finder link aligned to its baseline. Row 2: the featured product — photo
 * on the stage across 8 columns, its spec plate, price and a single CTA in
 * the remaining 4. No floating chips, no stats strip, no gradients.
 */
export function Hero({ dict, locale, product }: { dict: Dictionary; locale: Locale; product?: BaseProduct }) {
  const [line1, line2] = dict.ui.heroTitle.split("\n");

  const plate: { label: string; value: string; unit?: string }[] = [];
  if (product?.capacityWh) plate.push({ label: dict.specs.capacity, value: product.capacityWh.toLocaleString("uk-UA"), unit: dict.units.wh });
  if (product?.powerW) plate.push({ label: dict.specs.power, value: product.powerW.toLocaleString("uk-UA"), unit: dict.units.w });
  if (product?.batteryType) plate.push({ label: dict.specs.batteryType, value: product.batteryType });
  if (product?.weightKg) plate.push({ label: dict.specs.weight, value: String(product.weightKg), unit: dict.units.kg });

  return (
    <section className="pb-8 pt-8 sm:pb-12 sm:pt-14 lg:pt-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1 className="text-[40px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[64px] lg:col-span-9 lg:text-[80px]">
            {line1}
            {line2 && (
              <>
                <br />
                <span className="text-fg-2">{line2}</span>
              </>
            )}
          </h1>
          <div className="lg:col-span-3 lg:pb-2">
            <p className="max-w-sm text-base text-fg-2 sm:text-lg">{dict.ui.heroLead}</p>
            <Link
              href="/quiz"
              className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium underline-offset-4 hover:underline"
            >
              {dict.ui.heroQuiz} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {product && (
          <div className="mt-10 grid grid-cols-1 border-t border-fg sm:mt-14 lg:grid-cols-12">
            <Link
              href={productHref(product)}
              className="group relative -mx-4 block sm:-mx-6 lg:col-span-8 lg:mx-0"
              aria-label={product.name[locale]}
            >
              <ProductImage
                src={product.imageUrls?.[0]}
                alt={product.name[locale]}
                category={product.category}
                priority
                className="aspect-[4/3] w-full sm:aspect-[16/10]"
                imgClassName="transition-transform duration-500 ease-snap group-hover:scale-[1.02]"
              />
              <p className="caption absolute left-4 top-4 text-fg-2 sm:left-6 sm:top-6">
                {product.isNew ? `${dict.common.new} · ` : ""}
                {dict.categories[product.category].title}
              </p>
            </Link>

            <div className="flex flex-col pt-6 lg:col-span-4 lg:border-l lg:border-rule lg:pl-10 lg:pt-8">
              <p className="caption text-fg-2">{product.brand}</p>
              <h2 className="mt-2 text-[28px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[34px]">
                {product.name[locale].replace(new RegExp(`^${product.brand}\\s+`), "")}
              </h2>
              <p className="mt-3 text-fg-2">{product.tagline[locale]}</p>

              {plate.length > 0 && (
                <dl className="mt-8 grid grid-cols-2 border-t border-rule">
                  {plate.slice(0, 4).map((row, i) => (
                    <div
                      key={row.label}
                      className={`border-b border-rule py-3 ${i % 2 === 0 ? "pr-4" : "border-l pl-4"}`}
                    >
                      <dt className="caption text-fg-3">{row.label}</dt>
                      <dd className="num mt-1 text-[22px] font-semibold tracking-[-0.02em]">
                        {row.value}
                        {row.unit && <span className="spec ml-1 font-normal text-fg-2">{row.unit}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-8 lg:mt-10">
                <PriceTag price={product.price} oldPrice={product.oldPrice} size="md" />
                <div className="mt-5 flex items-center gap-5">
                  <Link href={productHref(product)} className={buttonVariants({ size: "lg", className: "flex-1 sm:flex-none" })}>
                    {dict.ui.heroCta}
                  </Link>
                  <Link
                    href={`/${product.category}`}
                    className="inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline"
                  >
                    {dict.ui.heroAll}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
