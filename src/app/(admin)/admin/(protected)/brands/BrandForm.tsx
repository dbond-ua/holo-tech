"use client";

import { useFormState } from "react-dom";
import { createBrandAction } from "../../actions";
import { SubmitButton } from "../../components/SubmitButton";

type FormState = { error: string } | { ok: true } | null;

export function BrandForm() {
  const [state, formAction] = useFormState<FormState, FormData>(createBrandAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-3">
      <div>
        <input
          name="name"
          required
          placeholder="Назва бренду"
          className="w-56 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        {state && "error" in state && <p className="mt-1.5 text-xs text-red-600">Помилка: {state.error}</p>}
      </div>
      <SubmitButton pendingText="Додавання…">Додати бренд</SubmitButton>
    </form>
  );
}
