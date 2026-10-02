import { brandLogos } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n/dictionary.types";

/**
 * Brands as a static index: a hairline grid of wordmarks set in the UI face.
 * (Replaces the marquee — constant motion with no information gain.)
 * File name kept so existing imports don't change.
 */
export function BrandsMarquee({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-6 border-t border-fg pt-4 sm:pt-5 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="caption flex gap-3 text-fg-2">
              <span className="text-fg">06</span>
              <span>{dict.home.brandsEyebrow}</span>
            </p>
            <h2 className="mt-5 text-[22px] font-semibold leading-tight tracking-[-0.015em] sm:mt-8">
              {dict.home.brandsTitle}
            </h2>
          </div>
          <ul className="grid grid-cols-2 border-l border-t border-rule sm:grid-cols-3 lg:col-span-9 lg:grid-cols-5">
            {brandLogos.map((b) => (
              <li
                key={b}
                className="flex h-16 items-center justify-center border-b border-r border-rule px-3 text-center text-[15px] font-semibold tracking-[-0.02em] text-fg-2 sm:h-20 sm:text-base"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
