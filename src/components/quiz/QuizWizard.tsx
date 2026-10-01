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

export function QuizWizard({ compact = false }: { compact?: boolean }) {
  const { dict } = useI18n();
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<DeviceKey | null>(null);
  const [duration, setDuration] = useState<DurationKey | null>(null);
  const [needsUPS, setNeedsUPS] = useState<boolean | null>(null);

  const devices = deviceMeta.map((d) => ({ ...d, label: dict.quiz.devices[d.key] }));

  const totalSteps = 3;

  const recommendations = useMemo(() => {
    if (!device || !duration || needsUPS === null) return [];
    const watts = deviceMeta.find((d) => d.key === device)!.watts;
    const requiredWh = watts * duration;
    const requiredW = Math.max(watts * 1.5, 500);

    const scored = stations
      .map((s) => {
        const capOk = (s.capacityWh ?? 0) >= requiredWh;
        const powOk = (s.powerW ?? 0) >= requiredW;
        const upsOk = !needsUPS || !!s.hasUPS;
        const score =
          (capOk ? 1 : 0) + (powOk ? 1 : 0) + (upsOk ? 1 : 0) - (s.capacityWh ?? 0) / 1_000_000;
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

  return (
    <div
      className={cn(
        "rounded-xl3 border border-line bg-surface p-6 dark:border-line-dark dark:bg-surface-dark sm:p-8",
        compact ? "" : "sm:p-10"
      )}
    >
      {!done ? (
        <>
          <div className="mb-8 flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-ink dark:bg-ink-dark" : "bg-line dark:bg-line-dark"
                )}
              />
            ))}
          </div>

          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-semibold">{dict.quiz.step1}</legend>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {devices.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => {
                      setDevice(d.key);
                      setStep(1);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl2 border p-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft",
                      device === d.key
                        ? "border-ink bg-black/[0.03] dark:border-white dark:bg-white/[0.06]"
                        : "border-line dark:border-line-dark"
                    )}
                  >
                    <d.icon className="h-6 w-6" strokeWidth={1.6} />
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="text-lg font-semibold">{dict.quiz.step2}</legend>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {durations.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setDuration(h);
                      setStep(2);
                    }}
                    className={cn(
                      "rounded-xl2 border p-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft",
                      duration === h
                        ? "border-ink bg-black/[0.03] dark:border-white dark:bg-white/[0.06]"
                        : "border-line dark:border-line-dark"
                    )}
                  >
                    {h === 12 ? dict.quiz.step2HoursPlus(h) : dict.quiz.step2Hours(h)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(0)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
              >
                <ArrowLeft className="h-4 w-4" /> {dict.quiz.back}
              </button>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="text-lg font-semibold">{dict.quiz.step3}</legend>
              <p className="mt-1 text-sm text-muted dark:text-muted-dark">{dict.quiz.step3Desc}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { v: true, label: dict.quiz.yes },
                  { v: false, label: dict.quiz.no },
                ].map((o) => (
                  <button
                    key={o.label}
                    onClick={() => {
                      setNeedsUPS(o.v);
                      setStep(3);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl2 border border-line p-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft dark:border-line-dark"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
              >
                <ArrowLeft className="h-4 w-4" /> {dict.quiz.back}
              </button>
            </fieldset>
          )}
        </>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{dict.quiz.resultsTitle}</h3>
              <p className="mt-1 text-sm text-muted dark:text-muted-dark">{dict.quiz.resultsDesc}</p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03] dark:border-line-dark dark:hover:bg-white/[0.06]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {dict.quiz.restart}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
