"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { stations } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { CompareTable } from "@/components/compare/CompareTable";
import { formatUAH, cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

const MAX_COMPARE = 4;

export default function ComparePage() {
  const { locale, dict } = useI18n();
  const [selected, setSelected] = useState<string[]>([
    stations[0].id,
    stations[1].id,
    stations[6].id,
  ]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  const selectedProducts = stations.filter((s) => selected.includes(s.id));

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        title={dict.compare.title}
        description={dict.compare.description(MAX_COMPARE)}
        as="h1"
      />

      <div className="mt-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {stations.map((s) => {
          const active = selected.includes(s.id);
          const disabled = !active && selected.length >= MAX_COMPARE;
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              disabled={disabled}
              className={cn(
                "flex w-44 shrink-0 flex-col items-start gap-2 rounded-xl2 border p-3 text-left transition-all",
                active
                  ? "border-ink bg-black/[0.03] dark:border-white dark:bg-white/[0.06]"
                  : "border-line dark:border-line-dark",
                disabled && "opacity-40"
              )}
            >
              <div className="relative w-full">
                <ProductVisual category="stations" seed={s.id} compact className="aspect-square w-full" />
                {active && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-xs font-medium">{s.name[locale]}</p>
              <p className="text-xs text-muted dark:text-muted-dark">{formatUAH(s.price)}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <CompareTable products={selectedProducts} onRemove={toggle} />
      </div>
    </Container>
  );
}
