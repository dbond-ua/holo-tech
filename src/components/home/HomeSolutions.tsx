import { Check, Clock, Zap, BatteryFull } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { homeSolutions } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PriceTag } from "@/components/ui/PriceTag";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionary.types";
import type { Locale } from "@/i18n/config";

const tierAccent: Record<string, string> = {
  basic: "border-line dark:border-line-dark",
  comfort: "border-accent-400 ring-1 ring-accent-400/40",
  max: "border-ink dark:border-white/40",
};

export function HomeSolutions({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={dict.home.solutionsEyebrow}
          title={dict.home.solutionsTitle}
          description={dict.home.solutionsDescription}
        />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {homeSolutions.map((s) => {
            const tier = dict.homeSolutions.tiers[s.tier];
            return (
              <div
                key={s.tier}
                className={cn(
                  "relative flex flex-col rounded-xl2 border bg-surface p-6 dark:bg-surface-dark",
                  tierAccent[s.tier]
                )}
              >
                {s.tier === "comfort" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    {dict.homeSolutions.popularBadge}
                  </span>
                )}
                <p className="text-lg font-semibold">{tier.title}</p>
                <p className="mt-1 text-sm text-muted dark:text-muted-dark">{dict.homeSolutions.forLabel}</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {tier.forList.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 shrink-0 text-volt-600 dark:text-volt" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 text-sm dark:border-line-dark">
                  <div className="flex items-center gap-2 text-muted dark:text-muted-dark">
                    <Zap className="h-4 w-4" /> {s.powerW} {dict.units.w}
                  </div>
                  <div className="flex items-center gap-2 text-muted dark:text-muted-dark">
                    <BatteryFull className="h-4 w-4" /> {s.capacityWh} {dict.units.wh}
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-muted dark:text-muted-dark">
                    <Clock className="h-4 w-4" /> {dict.homeSolutions.autonomyLabel} {s.runtimeApprox[locale]}
                  </div>
                </div>

                <div className="mt-5">
                  <PriceTag price={s.price} size="md" />
                </div>

                <Link
                  href="/quiz"
                  className={cn(
                    buttonVariants({ variant: s.tier === "comfort" ? "primary" : "outline" }),
                    "mt-5 w-full"
                  )}
                >
                  {dict.homeSolutions.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
