import { ArrowRight, PlugZap, BatteryFull } from "lucide-react";
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
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={dict.home.kitsEyebrow}
          title={dict.home.kitsTitle}
          description={dict.home.kitsDescription}
          action={
            <Link
              href="/kits"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
            >
              {dict.home.allKits} <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {kits.map((k) => (
            <Link
              key={k.id}
              href={`/kits/${k.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift dark:border-line-dark dark:bg-surface-dark"
            >
              <div className="aspect-[16/10] p-5">
                <ProductVisual category="kits" seed={k.id} className="h-full w-full" />
              </div>
              <div className="flex flex-1 flex-col p-5 pt-0">
                <p className="text-base font-semibold">{k.name[locale]}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted dark:text-muted-dark">
                  <span className="inline-flex items-center gap-1">
                    <PlugZap className="h-3.5 w-3.5" /> {k.inverterKw} {dict.kits.inverterUnit}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BatteryFull className="h-3.5 w-3.5" /> {k.batteryKwh} {dict.kits.batteryUnit}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted dark:text-muted-dark">{k.runtimeHours[locale]}</p>
                <div className="mt-auto pt-5">
                  <PriceTag price={k.price} oldPrice={k.oldPrice} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
