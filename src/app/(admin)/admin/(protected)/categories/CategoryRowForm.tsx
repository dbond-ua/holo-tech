"use client";

import { useFormState } from "react-dom";
import type { CategoryRow } from "@/lib/db/types";
import { updateCategoryAction } from "../../actions";
import { SubmitButton } from "../../components/SubmitButton";

type FormState = { error: string } | { ok: true } | null;

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink";

export function CategoryRowForm({ category }: { category: CategoryRow }) {
  const [state, formAction] = useFormState<FormState, FormData>(
    updateCategoryAction.bind(null, category.id),
    null
  );

  return (
    <form action={formAction} className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">{category.emoji}</span>
        <h2 className="text-sm font-semibold text-ink">{category.title_uk}</h2>
        <span className="text-xs text-muted">/{category.slug}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-ink">Назва (UA)</span>
          <input name="title_uk" defaultValue={category.title_uk} required className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-ink">Назва (EN)</span>
          <input name="title_en" defaultValue={category.title_en} required className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-ink">Коротка назва (UA)</span>
          <input name="short_title_uk" defaultValue={category.short_title_uk} required className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-ink">Коротка назва (EN)</span>
          <input name="short_title_en" defaultValue={category.short_title_en} required className={inputClass} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium text-ink">Опис (UA)</span>
          <textarea
            name="description_uk"
            defaultValue={category.description_uk}
            className={inputClass + " min-h-[70px] resize-y"}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium text-ink">Опис (EN)</span>
          <textarea
            name="description_en"
            defaultValue={category.description_en}
            className={inputClass + " min-h-[70px] resize-y"}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-ink">Емодзі</span>
          <input name="emoji" defaultValue={category.emoji} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-ink">Порядок сортування</span>
          <input type="number" name="sort_order" defaultValue={category.sort_order} className={inputClass} />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SubmitButton>Зберегти</SubmitButton>
        {state && "error" in state && <p className="text-sm text-red-600">Помилка: {state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-green-600">Збережено.</p>}
      </div>
    </form>
  );
}
