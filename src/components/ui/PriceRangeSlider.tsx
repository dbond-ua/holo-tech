"use client";

import { useEffect, useState } from "react";

/** Dual-thumb price range + two editable fields (₴). */
export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  labels = { from: "від", to: "до" },
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  labels?: { from: string; to: string };
}) {
  const [from, to] = value;
  const span = Math.max(max - min, 1);
  const [draft, setDraft] = useState<[string, string]>([String(from), String(to)]);

  useEffect(() => setDraft([String(from), String(to)]), [from, to]);

  function commit(index: 0 | 1, raw: string) {
    const n = Number(raw.replace(/\D/g, ""));
    if (!Number.isFinite(n) || raw === "") {
      setDraft([String(from), String(to)]);
      return;
    }
    if (index === 0) onChange([Math.min(Math.max(n, min), to - 1), to]);
    else onChange([from, Math.max(Math.min(n, max), from + 1)]);
  }

  const field =
    "num h-10 w-full rounded-sm border border-rule bg-panel pl-11 pr-2 text-sm outline-none transition-colors focus:border-fg";

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-rule" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-fg"
          style={{
            left: `${((from - min) / span) * 100}%`,
            right: `${100 - ((to - min) / span) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={from}
          aria-label={`Ціна ${labels.from}`}
          onChange={(e) => onChange([Math.min(Number(e.target.value), to - 1), to])}
          className="range-thumb pointer-events-none absolute inset-0 w-full bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={to}
          aria-label={`Ціна ${labels.to}`}
          onChange={(e) => onChange([from, Math.max(Number(e.target.value), from + 1)])}
          className="range-thumb pointer-events-none absolute inset-0 w-full bg-transparent"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([0, 1] as const).map((i) => (
          <label key={i} className="relative">
            <span className="caption pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3">
              {i === 0 ? labels.from : labels.to}
            </span>
            <input
              inputMode="numeric"
              value={draft[i]}
              onChange={(e) => {
                const next: [string, string] = [...draft];
                next[i] = e.target.value;
                setDraft(next);
              }}
              onBlur={(e) => commit(i, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit(i, (e.target as HTMLInputElement).value)}
              className={field}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
