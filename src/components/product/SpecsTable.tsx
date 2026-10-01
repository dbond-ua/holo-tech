import type { SpecEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Spec sheet: label / value rows on hairlines; two columns on wide screens. */
export function SpecsTable({ specs, columns = 2 }: { specs: SpecEntry[]; columns?: 1 | 2 }) {
  return (
    <dl className={cn("grid grid-cols-1 border-t border-rule", columns === 2 && "md:grid-cols-2 md:gap-x-10")}>
      {specs.map((s) => (
        <div key={s.label} className="flex items-baseline justify-between gap-6 border-b border-rule py-3 text-[15px]">
          <dt className="text-fg-2">{s.label}</dt>
          <dd className="num text-right font-medium">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
