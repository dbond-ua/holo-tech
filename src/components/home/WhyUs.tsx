import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n/dictionary.types";

/** Service facts as a dense text band — no icon tiles. */
export function WhyUs({ dict }: { dict: Dictionary }) {
  return (
    <section className="pb-4 pt-14 sm:pt-20">
      <Container>
        <div className="grid grid-cols-1 gap-6 border-t border-fg pt-4 sm:pt-5 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="caption flex gap-3 text-fg-2">
              <span className="text-fg">07</span>
              <span>{dict.ui.serviceEyebrow}</span>
            </p>
            <h2 className="mt-5 text-[22px] font-semibold leading-tight tracking-[-0.015em] sm:mt-8">
              {dict.home.whyUsTitle}
            </h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
            {dict.whyUs.map((item, i) => (
              <div key={item.title} className="border-b border-rule py-5 sm:pr-8">
                <dt className="flex items-baseline gap-3 text-[15px] font-semibold">
                  <span className="spec text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                  {item.title}
                </dt>
                <dd className="mt-1.5 pl-8 text-sm text-fg-2">{item.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
