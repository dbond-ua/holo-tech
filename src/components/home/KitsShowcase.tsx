import { ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { getKits } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PriceTag } from "@/components/ui/PriceTag";
import { ProductVisual } from "@/components/ui/ProductVisual";
import type { Dictionary } from "@/i18n/dictionary.types";
import type { Locale } from "@/i18n/config";

export async function KitsShowcase({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const kits = await getKits();
  if (kits.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          index="05"
          eyebrow={dict.home.kitsEyebrow}
          title={dict.home.kitsTitle}
          description={dict.home.kitsDescription}
          action={
            <Link
              href="/kits"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline"
            >
              {dict.home.allKits} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          }
        />

        <ul className="mt-8 grid grid-cols-1 border-l border-t border-rule sm:mt-12 md:grid-cols-3">
          {kits.map((k) => (
            <li key={k.id} className="border-b border-r border-rule">
              <KitCell kit={k} dict={dict} locale={locale} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function KitCell({
  kit,
  dict,
  locale,
  withDescription = false,
}: {
  kit: Awaited<ReturnType<typeof getKits>>[number];
  dict: Dictionary;
  locale: Locale;
  withDescription?: boolean;
}) {
  return (
    <Link href={`/kits/${kit.slug}`} className="group flex h-full flex-col bg-paper">
      <ProductVisual
        category="kits"
        className="aspect-[16/10] transition-colors duration-200 group-hover:bg-fg/[0.09]"
      />
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <p className="text-lg font-semibold leading-snug">{kit.name[locale]}</p>
        {withDescription && <p className="mt-2 text-sm text-fg-2">{kit.description[locale]}</p>}
        <dl className="mt-4 grid grid-cols-2 border-y border-rule">
          <div className="py-2.5 pr-3">
            <dt className="caption text-fg-3">{dict.specs.power}</dt>
            <dd className="num mt-0.5 font-medium">
              {kit.inverterKw} <span className="spec text-fg-2">{dict.kits.inverterUnit}</span>
            </dd>
          </div>
          <div className="border-l border-rule py-2.5 pl-3">
            <dt className="caption text-fg-3">{dict.specs.capacity}</dt>
            <dd className="num mt-0.5 font-medium">
              {kit.batteryKwh} <span className="spec text-fg-2">{dict.kits.batteryUnit}</span>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-fg-2">{kit.runtimeHours[locale]}</p>
        <div className="mt-auto flex items-end justify-between pt-6">
          <PriceTag price={kit.price} oldPrice={kit.oldPrice} />
          <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
        </div>
      </div>
    </Link>
  );
}
