"use client";

import { formatUAH } from "@/lib/utils";

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [from, to] = value;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-medium">
        <span>{formatUAH(from)}</span>
        <span>{formatUAH(to)}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line dark:bg-line-dark" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink dark:bg-ink-dark"
          style={{
            left: `${((from - min) / (max - min)) * 100}%`,
            right: `${100 - ((to - min) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={from}
          aria-label="Минимальная цена"
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), to - 1);
            onChange([next, to]);
          }}
          className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={to}
          aria-label="Максимальная цена"
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), from + 1);
            onChange([from, next]);
          }}
          className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
        />
      </div>
      <style jsx>{`
        .range-thumb {
          -webkit-appearance: none;
        }
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #0c0d0f;
          cursor: pointer;
          margin-top: 0;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #0c0d0f;
          cursor: pointer;
        }
        .range-thumb::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
