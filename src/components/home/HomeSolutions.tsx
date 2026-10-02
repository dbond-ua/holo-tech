import { ArrowRight } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { homeSolutions } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatUAH, cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionary.types";
import type { Locale } from "@/i18n/config";

/**
 * The three autonomy tiers as a comparison table (rows = tiers), not as SaaS
 * pricing cards. On mobile each row collapses into a compact block.
 * The recommended tier carries a signal marker on its left edge.
 */
export function HomeSolutions({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const cols = dict.ui;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          index="04"
          eyebrow={dict.home.solutionsEyebrow}
          title={dict.home.solutionsTitle}
          description={dict.home.solutionsDescription}
        />

        <div className="mt-8 sm:mt-12">
          {/* Column heads (desktop) */}
          <div className="caption hidden grid-cols-12 gap-6 border-b border-rule pb-3 text-fg-3 lg:grid">
            <span className="col-span-2">{cols.solutionsColTier}</span>
            <span className="col-span-4">{cols.solutionsColFor}</span>
            <span className="col-span-1 text-right">{cols.solutionsColPower}</span>
            <span className="col-span-1 text-right">{cols.solutionsColCapacity}</span>
            <span className="col-span-2">{cols.solutionsColAutonomy}</span>
            <span className="col-span-2 text-right">{cols.solutionsColPrice}</span>
          </div>

          <ul className="border-t border-rule lg:border-t-0">
            {homeSolutions.map((s) => {
              const tier = dict.homeSolutions.tiers[s.tier];
              const recommended = s.tier === "comfort";
              return (
                <li
                  key={s.tier}
                  className={cn(
                    "relative grid grid-cols-2 gap-x-6 gap-y-3 border-b border-rule py-5 lg:grid-cols-12 lg:items-center lg:py-6",
                    recommended && "lg:bg-fg/[0.025]"
                  )}
                >
                  {recommended && <span className="absolute -left-px bottom-0 top-0 w-[3px] bg-signal" aria-hidden="true" />}
                  <div className="col-span-2 pl-3 lg:col-span-2 lg:pl-5">
                    <p className="text-xl font-semibold tracking-[-0.01em]">{tier.title}</p>
                    {recommended && <p className="caption mt-1 text-signal-text">{cols.solutionsRecommended}</p>}
                  </div>
                  <p className="col-span-2 pl-3 text-[15px] text-fg-2 lg:col-span-4 lg:pl-0">{tier.forList.join(", ")}</p>
                  <p className="pl-3 lg:col-span-1 lg:pl-0 lg:text-right">
                    <span className="caption block text-fg-3 lg:hidden">{cols.solutionsColPower}</span>
                    <span className="num text-[17px] font-medium">{s.powerW.toLocaleString("uk-UA")}</span>
                    <span className="spec ml-1 text-fg-2">{dict.units.w}</span>
                  </p>
                  <p className="lg:col-span-1 lg:text-right">
                    <span className="caption block text-fg-3 lg:hidden">{cols.solutionsColCapacity}</span>
                    <span className="num text-[17px] font-medium">{s.capacityWh.toLocaleString("uk-UA")}</span>
                    <span className="spec ml-1 text-fg-2">{dict.units.wh}</span>
                  </p>
                  <p className="col-span-2 pl-3 text-[15px] lg:col-span-2 lg:pl-0">
                    <span className="caption mr-2 text-fg-3 lg:hidden">{cols.solutionsColAutonomy}</span>
                    {s.runtimeApprox[locale]}
                  </p>
                  <div className="col-span-2 flex items-center justify-between gap-4 pl-3 lg:col-span-2 lg:justify-end lg:pl-0 lg:pr-5">
                    <span className="num text-[22px] font-semibold tracking-[-0.02em]">{formatUAH(s.price)}</span>
                    <Link
                      href="/quiz"
                      aria-label={`${dict.homeSolutions.cta}: ${tier.title}`}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors",
                        recommended ? "bg-signal text-signal-ink hover:bg-signal/90" : "border border-rule hover:border-fg"
                      )}
                    >
                      <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
