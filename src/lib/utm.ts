"use client";

/**
 * Captures UTM parameters from the URL on first landing and persists them in
 * sessionStorage so they survive client-side navigation to the checkout page
 * even if the URL no longer carries them. Analytics use of this data is a
 * later stage — for now we only need to capture and pass it through to the
 * order (see /api/orders and the `orders.utm_*` columns).
 */

const STORAGE_KEY = "holotech:utm:v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export interface UtmData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export function captureUtmFromLocation(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) found[key] = value;
    }
    if (Object.keys(found).length > 0) {
      // A new campaign link overrides whatever was captured earlier this session.
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    } else if (!window.sessionStorage.getItem(STORAGE_KEY)) {
      // First visit with no UTM params — record that explicitly so we don't
      // keep re-checking on every navigation.
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    }
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — UTM capture is best-effort.
  }
}

export function getStoredUtm(): UtmData {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return {
      source: parsed.utm_source,
      medium: parsed.utm_medium,
      campaign: parsed.utm_campaign,
      content: parsed.utm_content,
      term: parsed.utm_term,
    };
  } catch {
    return {};
  }
}

export function getLandingPath(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const key = "holotech:landing-path:v1";
    let stored = window.sessionStorage.getItem(key);
    if (!stored) {
      stored = window.location.pathname;
      window.sessionStorage.setItem(key, stored);
    }
    return stored;
  } catch {
    return undefined;
  }
}
