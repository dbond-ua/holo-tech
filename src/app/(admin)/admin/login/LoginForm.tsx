"use client";

import { useFormState } from "react-dom";
import { loginAction } from "../actions";
import { SubmitButton } from "../components/SubmitButton";

type LoginState = { error: string } | null;

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Невірний email або пароль",
};

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
          placeholder="admin@holotech.store"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[state.error] ?? state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingText="Вхід…">
        Увійти
      </SubmitButton>
    </form>
  );
}
