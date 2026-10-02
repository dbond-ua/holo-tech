"use client";

import { useRef } from "react";
import { extractUaLocalDigits, formatUaLocalDigits, UA_LOCAL_DIGITS } from "@/lib/phone";
import { cn } from "@/lib/utils";

/**
 * Ukrainian-only phone input: "+380" is rendered as a fixed, non-editable
 * prefix outside the <input> — so the country code can never be typed over,
 * duplicated, or deleted — and the input itself only ever holds the 9-digit
 * local part, auto-grouped as "XX XXX XX XX" while typing. Pasting a full
 * number in any of the common shapes (+380953789383, 0953789383,
 * 953789383) is normalized down to the same 9 digits.
 *
 * `value` / `onChange` carry the raw local digits (0–9 chars), not the
 * formatted display string — the caller combines it with "+380" via
 * normalizeUaPhone() from @/lib/phone when it needs the full number.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  id,
  placeholder,
  className,
  invalid,
}: {
  value: string;
  onChange: (localDigits: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(nextDigits: string) {
    onChange(nextDigits.slice(0, UA_LOCAL_DIGITS));
  }

  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 rounded-sm border bg-panel pl-3.5 pr-1 transition-colors focus-within:border-fg",
        invalid ? "border-signal-text" : "border-rule",
        className
      )}
    >
      <span className="num select-none text-[15px] text-fg-2" aria-hidden>
        +380
      </span>
      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        // Displayed value is always the grouped digits — never includes "+380",
        // so there is nothing for the user to delete or overwrite there.
        value={formatUaLocalDigits(value)}
        aria-invalid={invalid || undefined}
        onChange={(e) => commit(extractUaLocalDigits(e.target.value))}
        onPaste={(e) => {
          e.preventDefault();
          commit(extractUaLocalDigits(e.clipboardData.getData("text")));
        }}
        onKeyDown={(e) => {
          // Block letters and symbols outright (digits, navigation, and
          // editing keys pass through) so nothing but numbers ever lands
          // in the field, on top of the digit-stripping in commit().
          const allowed = [
            "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "Tab", "Home", "End", "Enter",
          ];
          if (e.metaKey || e.ctrlKey || allowed.includes(e.key)) return;
          if (!/^\d$/.test(e.key)) e.preventDefault();
        }}
        onBlur={onBlur}
        className="h-full w-full min-w-0 bg-transparent text-[15px] tabular-nums outline-none placeholder:text-fg-3"
      />
    </div>
  );
}
