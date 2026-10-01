/**
 * Ukrainian mobile phone number handling — shared between the checkout UI
 * (src/components/checkout/PhoneInput.tsx) and server-side validation
 * (src/app/api/orders/route.ts). Never trust the client: the server always
 * re-runs normalizeUaPhone() on whatever string arrives, regardless of what
 * the browser already checked.
 *
 * Canonical stored format: "+380XXXXXXXXX" (normalized, no spaces) — that's
 * what goes in the database (orders.phone, customers.phone). Display format
 * for humans is "+380 XX XXX XX XX" (formatUaPhoneDisplay).
 */

// Current Ukrainian mobile operator prefixes (the two digits right after
// "380"). Not a legally exhaustive registry — covers Kyivstar, Vodafone
// Ukraine, lifecell and the smaller MVNOs — but the list is exported so it's
// a single place to extend if a real number gets rejected.
export const UA_MOBILE_PREFIXES = [
  "39", "50", "63", "66", "67", "68", "73",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
] as const;

export const UA_LOCAL_DIGITS = 9; // digits after "+380"

export type PhoneValidationError = "too_short" | "too_long" | "invalid_prefix" | "empty";

export interface NormalizeResult {
  /** "+380XXXXXXXXX" when valid, otherwise null. */
  normalized: string | null;
  /** The local part typed so far (0–9 digits), useful for re-hydrating an input. */
  localDigits: string;
  error?: PhoneValidationError;
}

function digitsOnly(s: string): string {
  return s.replace(/\D+/g, "");
}

/**
 * Extracts the 9-digit local part from arbitrary pasted/typed input, handling
 * the three shapes the spec calls out: "+380953789383", "0953789383" (typed
 * with the domestic trunk 0), and a bare 9-digit local part "953789383".
 * Never produces more than 9 digits — anything past that is truncated so a
 * bad paste can't silently overflow the field.
 */
export function extractUaLocalDigits(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.startsWith("380") && digits.length >= 3) {
    return digits.slice(3, 3 + UA_LOCAL_DIGITS);
  }
  if (digits.startsWith("0") && digits.length >= 1) {
    return digits.slice(1, 1 + UA_LOCAL_DIGITS);
  }
  return digits.slice(0, UA_LOCAL_DIGITS);
}

/** Groups a (partial) 9-digit local part as "XX XXX XX XX" for display. */
export function formatUaLocalDigits(local: string): string {
  const d = digitsOnly(local).slice(0, UA_LOCAL_DIGITS);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

/** "+380953789383" -> "+380 95 378 93 83". Falls back to the raw string if it doesn't match. */
export function formatUaPhoneDisplay(normalized: string | null | undefined): string {
  if (!normalized) return "";
  const digits = digitsOnly(normalized);
  if (digits.startsWith("380") && digits.length === 12) {
    return `+380 ${formatUaLocalDigits(digits.slice(3))}`;
  }
  return normalized;
}

/**
 * Validates and normalizes a Ukrainian mobile number from any of the input
 * shapes a user might type or paste. Used identically on the client (for
 * inline error messages) and on the server (as the actual source of truth —
 * the server never trusts a client-computed `normalized` value).
 */
export function normalizeUaPhone(raw: string): NormalizeResult {
  const local = extractUaLocalDigits(raw ?? "");
  if (!local) return { normalized: null, localDigits: local, error: "empty" };
  if (local.length < UA_LOCAL_DIGITS) return { normalized: null, localDigits: local, error: "too_short" };
  if (local.length > UA_LOCAL_DIGITS) return { normalized: null, localDigits: local, error: "too_long" };

  const prefix = local.slice(0, 2);
  if (!(UA_MOBILE_PREFIXES as readonly string[]).includes(prefix)) {
    return { normalized: null, localDigits: local, error: "invalid_prefix" };
  }

  return { normalized: `+380${local}`, localDigits: local };
}
