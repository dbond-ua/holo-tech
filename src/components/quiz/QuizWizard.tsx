"use client";

import { useMemo, useState } from "react";
import {
  Refrigerator,
  Monitor,
  Tv,
  Flame,
  Lightbulb,
  LayoutGrid,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { stations } from "@/lib/data";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

type DeviceKey = "fridge" | "computer" | "tv" | "boiler" | "lighting" | "multiple";
type DurationKey = 2 | 4 | 8 | 12;

const deviceMeta: { key: DeviceKey; watts: number; icon: typeof Refrigerator }[] = [
  { key: "fridge", watts: 180, icon: Refrigerator },
  { key: "computer", watts: 320, icon: Monitor },
  { key: "tv", watts: 110, icon: Tv },
  { key: "boiler", watts: 130, icon: Flame },
  { key: "lighting", watts: 60, icon: Lightbulb },
  { key: "multiple", watts: 550, icon: LayoutGrid },
];

const durations: DurationKey[] = [2, 4, 8, 12];
/** Readout bar scale (Wh). */
const SCALE_WH = 6600;

/**
 * Station finder, styled as an instrument: questions on the left, a live
 * readout on the right that shows the capacity the answers add up to.
 * Recommendation logic is unchanged (same device wattages, same scoring).
 */
export function QuizWizard({ compact = false }: { compact?: boolean }) {
  const { dict } = useI18n();
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<DeviceKey | null>(null);
  const [duration, setDuration] = useState<DurationKey | null>(null);
  const [needsUPS, setNeedsUPS] = useState<boolean | null>(null);

  const devices = deviceMeta.map((d) => ({ ...d, label: dict.quiz.devices[d.key] }));
  const totalSteps = 3;
  const watts = device ? deviceMeta.find((d) => d.key === device)!.watts : null;
  const requiredWh = watts && duration ? watts * duration : null;

  const recommendations = useMemo(() => {
    if (!device || !duration || needsUPS === null) return [];
    const w = deviceMeta.find((d) => d.key === device)!.watts;
    const reqWh = w * duration;
    const reqW = Math.max(w * 1.5, 500);

    const scored = stations
      .map((s) => {
        const capOk = (s.capacityWh ?? 0) >= reqWh;
        const powOk = (s.powerW ?? 0) >= reqW;
        const upsOk = !needsUPS || !!s.hasUPS;
        const score = (capOk ? 1 : 0) + (powOk ? 1 : 0) + (upsOk ? 1 : 0) - (s.capacityWh ?? 0) / 1_000_000;
        return { s, score, fits: capOk && powOk && upsOk };
      })
      .sort((a, b) => b.score - a.score || a.s.price - b.s.price);

    const fitting = scored.filter((x) => x.fits);
    const pool = fitting.length > 0 ? fitting : scored;
    return pool.slice(0, 3).map((x) => x.s);
  }, [device, duration, needsUPS]);

  const done = step >= totalSteps;

  function reset() {
    setStep(0);
    setDevice(null);
    setDuration(null);
    setNeedsUPS(null);
  }

  const option = (selected: boolean) =>
    cn(
      "flex items-center gap-3 border-b border-r border-rule bg-paper px-4 text-left text-[15px] transition-colors",
      compact ? "h-16" : "h-[72px]",
      selected ? "bg-fg text-paper" : "hover:bg-fg/[0.04]"
    );

  const backButton = (to: number) => (
    <button
      type="button"
      onClick={() => setStep(to)}
      className="mt-5 inline-flex items-center gap-1.5 text-sm text-fg-2 transition-colors hover:text-fg"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> {dict.quiz.back}
    </button>
  );

  const readoutRows: { label: string; value: string | null }[] = [
    { label: dict.quiz.step1, value: device ? `${dict.quiz.devices[device]} · ${watts} ${dict.units.w}` : null },
    {
      label: dict.quiz.step2,
      value: duration ? (duration === 12 ? dict.quiz.step2HoursPlus(duration) : dict.quiz.step2Hours(duration)) : null,
    },
    { label: "UPS", value: needsUPS === null ? null : needsUPS ? dict.quiz.yes : dict.quiz.no },
  ];

  return (
    <div className="grid grid-cols-1 border-t border-fg lg:grid-cols-12">
      {/* Questions */}
      <div className="py-6 lg:col-span-8 lg:border-r lg:border-rule lg:py-8 lg:pr-10">
        {!done ? (
          <>
            <p className="spec text-fg-2">{dict.ui.quizStep(step + 1, totalSteps)}</p>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span key={i} className={cn("h-0.5 flex-1", i <= step ? "bg-fg" : "bg-rule")} />
              ))}
            </div>

            {step === 0 && (
              <fieldset className="mt-6">
                <legend className="text-h3 font-semibold">{dict.quiz.step1}</legend>
                <div className="mt-5 grid grid-cols-1 border-l border-t border-rule sm:grid-cols-2 xl:grid-cols-3">
                  {devices.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setDevice(d.key);
                        setStep(1);
                      }}
                      className={option(device === d.key)}
                    >
                      <d.icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                      <span className="flex-1">{d.label}</span>
                      <span className={cn("spec", device === d.key ? "text-paper/70" : "text-fg-3")}>
                        {d.watts} {dict.units.w}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset className="mt-6">
                <legend className="text-h3 font-semibold">{dict.quiz.step2}</legend>
                <div className="mt-5 grid grid-cols-2 border-l border-t border-rule sm:grid-cols-4">
                  {durations.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setDuration(h);
                        setStep(2);
                      }}
                      className={cn(option(duration === h), "justify-center")}
                    >
                      {h === 12 ? dict.quiz.step2HoursPlus(h) : dict.quiz.step2Hours(h)}
                    </button>
                  ))}
                </div>
                {backButton(0)}
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="mt-6">
                <legend className="text-h3 font-semibold">{dict.quiz.step3}</legend>
                <p className="mt-1 max-w-lg text-sm text-fg-2">{dict.quiz.step3Desc}</p>
                <div className="mt-5 grid grid-cols-2 border-l border-t border-rule">
                  {[
                    { v: true, label: dict.quiz.yes },
                    { v: false, label: dict.quiz.no },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => {
                        setNeedsUPS(o.v);
                        setStep(3);
                      }}
                      className={cn(option(needsUPS === o.v), "justify-center")}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {backButton(1)}
              </fieldset>
            )}
          </>
        ) : (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-h3 font-semibold">{dict.quiz.resultsTitle}</h3>
                <p className="mt-1 text-sm text-fg-2">{dict.quiz.resultsDesc}</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> {dict.quiz.restart}
              </button>
            </div>

            <ul className="mt-6 grid grid-cols-1 border-l border-t border-rule sm:grid-cols-3">
              {recommendations.map((p) => (
                <li key={p.id} className="flex border-b border-r border-rule">
                  <ProductCard product={p} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Readout */}
      <aside className="border-t border-rule py-6 lg:col-span-4 lg:border-t-0 lg:py-8 lg:pl-10" aria-live="polite">
        <p className="caption text-fg-2">{dict.ui.quizNeed}</p>
        <p className="num mt-2 text-[44px] font-semibold leading-none tracking-[-0.03em] sm:text-[56px]">
          {requiredWh ? (
            <>
              ≈ {requiredWh.toLocaleString("uk-UA")}
              <span className="spec ml-2 align-middle text-base font-normal text-fg-2">{dict.units.wh}</span>
            </>
          ) : (
            <span className="text-fg-3">0</span>
          )}
        </p>
        <div className="mt-5 h-2 w-full bg-stage" aria-hidden="true">
          <div
            className="h-full bg-signal transition-[width] duration-500 ease-snap"
            style={{ width: `${requiredWh ? Math.min(100, (requiredWh / SCALE_WH) * 100) : 0}%` }}
          />
        </div>
        <dl className="mt-6 border-t border-rule">
          {readoutRows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 text-sm">
              <dt className="text-fg-2">{r.label}</dt>
              <dd className={cn("text-right", r.value ? "font-medium" : "text-fg-3")}>{r.value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
