import { ArrowRight, Zap, ShieldCheck, BatteryCharging } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { ProductVisual } from "@/components/ui/ProductVisual";
import type { Dictionary } from "@/i18n/dictionary.types";

export function Hero({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] opacity-70 dark:opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(37,99,255,0.12), transparent 70%)",
        }}
      />
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="animate-slide-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-muted dark:border-line-dark dark:text-muted-dark">
              <Zap className="h-3.5 w-3.5 text-accent" />
              {dict.hero.badge}
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {dict.hero.title}
            </h1>
            <p className="mt-5 max-w-lg text-balance text-lg text-muted dark:text-muted-dark">
              {dict.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/stations" className={buttonVariants({ size: "lg", className: "group" })}>
                {dict.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/quiz" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {dict.hero.ctaSecondary}
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8 dark:border-line-dark">
              <div>
                <dt className="text-xs text-muted dark:text-muted-dark">{dict.hero.statModels}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">40+</dd>
              </div>
              <div>
                <dt className="text-xs text-muted dark:text-muted-dark">{dict.hero.statBrands}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">10</dd>
              </div>
              <div>
                <dt className="text-xs text-muted dark:text-muted-dark">{dict.hero.statWarranty}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">{dict.hero.warrantyValue}</dd>
              </div>
            </dl>
          </div>

          <div className="relative animate-scale-in [animation-delay:120ms]">
            <div className="relative aspect-square w-full max-w-lg justify-self-center overflow-hidden rounded-xl3 border border-line bg-gradient-to-br from-accent-50 via-white to-white shadow-lift dark:border-line-dark dark:from-accent-500/10 dark:via-surface-dark dark:to-surface-dark">
              <ProductVisual category="stations" seed="hero-delta-pro-3" className="h-full w-full" />
            </div>

            <div className="absolute -left-4 top-6 hidden animate-fade-in rounded-2xl border border-line bg-surface/90 p-3 shadow-soft backdrop-blur sm:flex sm:items-center sm:gap-3 dark:border-line-dark dark:bg-surface-dark/90 [animation-delay:400ms]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/20 text-volt-600 dark:text-volt">
                <BatteryCharging className="h-[18px] w-[18px]" />
              </span>
              <div className="pr-2">
                <p className="text-xs text-muted dark:text-muted-dark">{dict.hero.capacityLabel}</p>
                <p className="text-sm font-semibold">4096 {dict.units.wh}</p>
              </div>
            </div>

            <div className="absolute -right-4 bottom-8 hidden animate-fade-in rounded-2xl border border-line bg-surface/90 p-3 shadow-soft backdrop-blur sm:flex sm:items-center sm:gap-3 dark:border-line-dark dark:bg-surface-dark/90 [animation-delay:600ms]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
              <div className="pr-2">
                <p className="text-xs text-muted dark:text-muted-dark">{dict.hero.upsLabel}</p>
                <p className="text-sm font-semibold">{dict.hero.upsValue}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
