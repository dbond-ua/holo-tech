"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { stations } from "@/lib/data";
import { Container } from "@/components/ui/Container";
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
    <Container className="pt-6 sm:pt-10">
      <h1 className="text-[34px] font-semibold leading-none tracking-[-0.03em] sm:text-h1">{dict.compare.title}</h1>
      <p className="mt-3 text-fg-2 sm:text-lg">{dict.compare.description(MAX_COMPARE)}</p>

      <ul className="no-scrollbar -mx-4 mt-8 flex overflow-x-auto border-y border-rule px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:border-l lg:px-0">
        {stations.map((s) => {
          const active = selected.includes(s.id);
          const disabled = !active && selected.length >= MAX_COMPARE;
          return (
            <li key={s.id} className="shrink-0 border-r border-rule first:border-l lg:first:border-l-0">
              <button
                type="button"
                onClick={() => toggle(s.id)}
                disabled={disabled}
                aria-pressed={active}
                className={cn(
                  "flex w-40 flex-col items-start gap-2 p-3 text-left transition-colors",
                  active ? "bg-fg text-paper" : "hover:bg-fg/[0.04]",
                  disabled && "opacity-40"
                )}
              >
                <ProductVisual category="stations" compact className="aspect-[4/3] w-full" />
                <p className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-tight">{s.name[locale]}</p>
                <p className={cn("num flex w-full items-center justify-between text-[13px]", active ? "text-paper/70" : "text-fg-2")}>
                  {formatUAH(s.price)}
                  {active && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-10">
        <CompareTable products={selectedProducts} onRemove={toggle} />
      </div>
    </Container>
  );
}
