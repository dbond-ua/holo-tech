import type { SpecEntry } from "@/lib/types";

export function SpecsTable({ specs }: { specs: SpecEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-line dark:border-line-dark">
      {specs.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${
            i % 2 === 1 ? "bg-black/[0.02] dark:bg-white/[0.03]" : ""
          }`}
        >
          <span className="text-muted dark:text-muted-dark">{s.label}</span>
          <span className="font-medium">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
