import { brandLogos } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/dictionary.types";

export function BrandsMarquee({ dict }: { dict: Dictionary }) {
  const loop = [...brandLogos, ...brandLogos];

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={dict.home.brandsEyebrow} title={dict.home.brandsTitle} />
      </Container>
      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent dark:from-canvas-dark sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent dark:from-canvas-dark sm:w-32" />
        <div className="flex w-max animate-marquee gap-3 motion-reduce:animate-none">
          {loop.map((b, i) => (
            <div
              key={`${b}-${i}`}
              className="flex h-16 w-44 shrink-0 items-center justify-center rounded-xl2 border border-line text-sm font-semibold tracking-tight text-muted dark:border-line-dark dark:text-muted-dark sm:h-20 sm:w-56"
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
