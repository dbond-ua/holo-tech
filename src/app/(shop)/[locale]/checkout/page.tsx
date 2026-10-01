"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/CartContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActionBar } from "@/components/ui/useActionBar";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { PhoneInput } from "@/components/checkout/PhoneInput";
import { Combobox, type ComboboxItem } from "@/components/checkout/Combobox";
import { formatUAH, cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { getStoredUtm, getLandingPath } from "@/lib/utm";
import { normalizeUaPhone } from "@/lib/phone";
import { localePath } from "@/i18n/localePath";
import type { DeliveryMethod } from "@/lib/db/types";

const inputClass =
  "h-12 w-full rounded-sm border border-rule bg-panel px-3.5 text-[15px] outline-none transition-colors placeholder:text-fg-3 focus:border-fg disabled:opacity-50";
const labelClass = "mb-1.5 block text-sm text-fg-2";

interface NpCity {
  ref: string;
  name: string;
  area: string;
}
interface NpWarehouse {
  ref: string;
  name: string;
  number: string;
  type: "warehouse" | "poshtomat" | "other";
}

/** Maps the checkout's delivery-method choice to the `type` the backend
 *  filters warehouses by — see GET /api/nova-poshta/warehouses. */
function warehouseTypeForMethod(method: DeliveryMethod): "warehouse" | "poshtomat" {
  return method === "np_poshtomat" ? "poshtomat" : "warehouse";
}

interface FormState {
  name: string;
  /** Raw 9-digit local part, no "+380" — see src/lib/phone.ts. */
  phoneLocal: string;
  deliveryMethod: DeliveryMethod;
  cityQuery: string;
  npCityRef: string;
  npCityName: string;
  warehouseQuery: string;
  npWarehouseRef: string;
  npWarehouseName: string;
  courierAddress: string;
  comment: string;
}

const initialForm: FormState = {
  name: "",
  phoneLocal: "",
  deliveryMethod: "np_warehouse",
  cityQuery: "",
  npCityRef: "",
  npCityName: "",
  warehouseQuery: "",
  npWarehouseRef: "",
  npWarehouseName: "",
  courierAddress: "",
  comment: "",
};

export default function CheckoutPage() {
  const { cart, cartTotal, cartCount, clearCart, hydrated } = useStore();
  const { locale, dict } = useI18n();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [cityResults, setCityResults] = useState<NpCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<NpWarehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useActionBar();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isNovaPoshta = form.deliveryMethod === "np_warehouse" || form.deliveryMethod === "np_poshtomat";
  const phoneResult = useMemo(() => normalizeUaPhone(form.phoneLocal), [form.phoneLocal]);
  const phoneInvalid = phoneTouched && Boolean(phoneResult.error) && form.phoneLocal.length > 0;

  // City search — debounced against the local Nova Poshta directory
  // (src/lib/novaposhta.ts, backed by nova_cities in Postgres). Fetches even
  // with an empty query — GET /api/nova-poshta/cities with no `q` returns a
  // default listing — so the combobox has a list ready the instant the field
  // is focused, with no typing required; every fetch only ever returns the
  // bounded set the dropdown can show, never the full directory.
  useEffect(() => {
    if (!isNovaPoshta) return;
    if (cityDebounce.current) clearTimeout(cityDebounce.current);
    setCityLoading(true);
    cityDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(form.cityQuery)}`);
        const json = await res.json();
        setCityResults(json.cities ?? []);
      } catch {
        setCityResults([]);
      } finally {
        setCityLoading(false);
      }
    }, 300);
    return () => {
      if (cityDebounce.current) clearTimeout(cityDebounce.current);
    };
  }, [form.cityQuery, isNovaPoshta]);

  function handleCityQueryChange(q: string) {
    update("cityQuery", q);
    // A city was previously committed but the user is now typing something
    // else — invalidate it (and the branch that depended on it) rather than
    // silently submitting a mismatched Ref for whatever text is on screen.
    if (form.npCityRef && q !== form.npCityName) {
      update("npCityRef", "");
      update("npCityName", "");
      update("warehouseQuery", "");
      update("npWarehouseRef", "");
      update("npWarehouseName", "");
      setWarehouses([]);
    }
  }

  function selectCity(item: ComboboxItem) {
    update("npCityRef", item.ref);
    update("npCityName", item.label);
    update("cityQuery", item.label);
    update("warehouseQuery", "");
    update("npWarehouseRef", "");
    update("npWarehouseName", "");
  }

  // Fetches only the selected city's warehouses/postomats, and only the type
  // the current delivery-method tab needs (GET .../warehouses?cityRef=...&
  // type=...) — the backend does the filtering, so the frontend never has to
  // load one city's full branch list and filter it client-side. Re-runs
  // whenever the city or the "Відділення"/"Поштомат" tab changes.
  useEffect(() => {
    if (!isNovaPoshta || !form.npCityRef) {
      setWarehouses([]);
      return;
    }
    setWarehousesLoading(true);
    const type = warehouseTypeForMethod(form.deliveryMethod);
    fetch(`/api/nova-poshta/warehouses?cityRef=${encodeURIComponent(form.npCityRef)}&type=${type}`)
      .then((res) => res.json())
      .then((json) => setWarehouses(json.warehouses ?? []))
      .catch(() => setWarehouses([]))
      .finally(() => setWarehousesLoading(false));
  }, [form.npCityRef, form.deliveryMethod, isNovaPoshta]);

  // Local, in-memory filter over the (already city-and-type-scoped, already
  // bounded) branch list — no extra network round trip needed for this one,
  // but still a real searchable combobox rather than a giant <select>.
  const warehouseOptions = useMemo(() => {
    const q = form.warehouseQuery.trim().toLowerCase();
    const list = q ? warehouses.filter((w) => w.name.toLowerCase().includes(q)) : warehouses;
    return list.map((w): ComboboxItem => ({ ref: w.ref, label: w.name }));
  }, [warehouses, form.warehouseQuery]);

  function handleWarehouseQueryChange(q: string) {
    update("warehouseQuery", q);
    if (form.npWarehouseRef && q !== form.npWarehouseName) {
      update("npWarehouseRef", "");
      update("npWarehouseName", "");
    }
  }

  function selectWarehouse(item: ComboboxItem) {
    update("npWarehouseRef", item.ref);
    update("npWarehouseName", item.label);
    update("warehouseQuery", item.label);
  }

  const isValid =
    form.name.trim().length > 1 &&
    Boolean(phoneResult.normalized) &&
    (isNovaPoshta
      ? Boolean(form.npCityRef) && Boolean(form.npWarehouseRef)
      : form.courierAddress.trim().length > 3);

  async function handleSubmit() {
    setPhoneTouched(true);
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const utm = getStoredUtm();
    const landingPath = getLandingPath();

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: phoneResult.normalized,
          city: isNovaPoshta ? form.npCityName : undefined,
          deliveryMethod: form.deliveryMethod,
          npCityRef: form.npCityRef || undefined,
          npCityName: form.npCityName || undefined,
          npWarehouseRef: form.npWarehouseRef || undefined,
          npWarehouseName: form.npWarehouseName || undefined,
          courierAddress: form.courierAddress || undefined,
          comment: form.comment || undefined,
          locale,
          items: cart.map((item) => ({
            productId: item.category !== "kits" ? item.id : undefined,
            kitId: item.category === "kits" ? item.id : undefined,
            nameUk: item.name.uk,
            nameEn: item.name.en,
            price: item.price,
            qty: item.qty,
          })),
          utm,
          landingPath,
        }),
      });

      if (!res.ok) {
        setSubmitError(dict.checkout.emptyText);
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      try {
        window.sessionStorage.setItem(`holotech:order:${data.orderNumber}`, JSON.stringify(data));
      } catch {
        // ignore — the success page can still show the order number itself
      }
      clearCart();
      // Locale-prefixed push — a plain router.push("/order/...") loses the
      // current locale (the middleware would redirect it to the *default*
      // locale, silently bouncing an EN visitor's confirmation page to UK).
      router.push(localePath(locale, `/order/${data.orderNumber}`));
    } catch {
      setSubmitError(dict.checkout.emptyText);
      setSubmitting(false);
    }
  }

  if (hydrated && cart.length === 0) {
    return (
      <Container className="pt-6 sm:pt-10">
        <h1 className="mb-6 text-[34px] font-semibold leading-none tracking-[-0.03em] sm:mb-10 sm:text-h1">
          {dict.checkout.title}
        </h1>
        <EmptyState title={dict.checkout.emptyTitle} text={dict.checkout.emptyText} lead={dict.ui.emptyCartLead} />
      </Container>
    );
  }

  const deliveryOptions: { key: DeliveryMethod; label: string }[] = [
    { key: "np_warehouse", label: dict.checkout.methodNpWarehouse },
    { key: "np_poshtomat", label: dict.checkout.methodNpPoshtomat },
    { key: "courier", label: dict.checkout.methodCourier },
  ];

  const cityComboboxItems: ComboboxItem[] = cityResults.map((c) => ({
    ref: c.ref,
    label: c.name,
    sublabel: c.area,
  }));

  const step = (n: number, title: string) => (
    <h2 className="flex items-baseline gap-4 text-h3 font-semibold">
      <span className="spec text-fg-3">{dict.ui.stepIndex(n)}</span>
      {title}
    </h2>
  );

  const submitButton = (className?: string) => (
    <Button size="lg" disabled={!isValid || submitting} onClick={handleSubmit} className={className}>
      {submitting ? dict.checkout.submitting : dict.checkout.confirmBtn}
    </Button>
  );

  return (
    <Container className="pt-6 sm:pt-10">
      <h1 className="mb-6 text-[34px] font-semibold leading-none tracking-[-0.03em] sm:mb-10 sm:text-h1">
        {dict.checkout.title}
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="flex flex-col lg:col-span-7">
          <section className="border-t border-fg py-6 sm:py-8">
            {step(1, dict.checkout.contactsTitle)}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="name">
                  {dict.checkout.nameLabel}
                </label>
                <input
                  id="name"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={dict.checkout.namePlaceholder}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">
                  {dict.checkout.phoneLabel}
                </label>
                <PhoneInput
                  id="phone"
                  value={form.phoneLocal}
                  onChange={(digits) => update("phoneLocal", digits)}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder={dict.checkout.phonePlaceholder}
                  invalid={phoneInvalid}
                />
                {phoneInvalid && (
                  <p className="mt-1.5 text-[13px] text-signal-text">
                    {phoneResult.error === "invalid_prefix" ? dict.checkout.phoneErrorPrefix : dict.checkout.phoneErrorIncomplete}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-rule py-6 sm:py-8">
            {step(2, dict.checkout.deliveryTitle)}
            <div className="mt-6 border-t border-rule" role="radiogroup" aria-label={dict.checkout.deliveryTitle}>
              {deliveryOptions.map((m) => {
                const selected = form.deliveryMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      update("deliveryMethod", m.key);
                      update("npWarehouseRef", "");
                      update("npWarehouseName", "");
                      update("warehouseQuery", "");
                    }}
                    className="flex h-14 w-full items-center gap-3 border-b border-rule text-left text-[15px] transition-colors hover:bg-fg/[0.03]"
                  >
                    <span
                      className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                        selected ? "border-fg" : "border-fg-3"
                      )}
                    >
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-fg" />}
                    </span>
                    <span className={selected ? "font-medium" : ""}>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {isNovaPoshta ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="city">
                    {dict.checkout.cityLabel}
                  </label>
                  <Combobox
                    id="city"
                    query={form.cityQuery}
                    onQueryChange={handleCityQueryChange}
                    items={cityComboboxItems}
                    onSelect={selectCity}
                    loading={cityLoading}
                    placeholder={dict.checkout.cityPlaceholder}
                    noResultsText={dict.checkout.cityNoResults}
                    selectedLabel={form.npCityName || null}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="warehouse">
                    {dict.checkout.warehouseLabel}
                  </label>
                  <Combobox
                    id="warehouse"
                    query={form.warehouseQuery}
                    onQueryChange={handleWarehouseQueryChange}
                    items={warehouseOptions}
                    onSelect={selectWarehouse}
                    loading={warehousesLoading}
                    disabled={!form.npCityRef}
                    placeholder={form.npCityRef ? dict.checkout.warehousePlaceholder : dict.checkout.warehouseSelectCityFirst}
                    noResultsText={dict.checkout.warehouseNoResults}
                    selectedLabel={form.npWarehouseName || null}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <label className={labelClass} htmlFor="address">
                  {dict.checkout.addressLabel}
                </label>
                <input
                  id="address"
                  className={inputClass}
                  value={form.courierAddress}
                  onChange={(e) => update("courierAddress", e.target.value)}
                  placeholder={dict.checkout.addressPlaceholder}
                />
              </div>
            )}
          </section>

          <section className="border-t border-rule py-6 sm:py-8">
            {step(3, dict.checkout.commentLabel)}
            <textarea
              id="comment"
              aria-label={dict.checkout.commentLabel}
              rows={3}
              className={cn(inputClass, "mt-6 h-auto resize-none py-3")}
              value={form.comment}
              onChange={(e) => update("comment", e.target.value)}
              placeholder={dict.checkout.commentPlaceholder}
            />
          </section>

          {submitError && <p className="pb-4 text-sm text-signal-text">{submitError}</p>}
          <div className="hidden border-t border-rule pt-6 lg:block">{submitButton("w-full")}</div>
        </div>

        <aside className="lg:col-span-5 lg:col-start-8">
          <div className="border-t border-fg lg:sticky lg:top-[8.5rem]">
            <h2 className="py-4 text-base font-semibold">{dict.checkout.yourOrderTitle}</h2>
            <ul className="border-t border-rule">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center gap-3 border-b border-rule py-3">
                  <ProductVisual category={item.category} compact className="h-14 w-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name[locale]}</p>
                    <p className="num text-[13px] text-fg-2">
                      {item.qty} × {formatUAH(item.price)}
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-medium">{formatUAH(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="text-[15px]">
              <div className="flex justify-between gap-4 border-b border-rule py-3">
                <dt className="text-fg-2">{dict.cart.shippingLabel}</dt>
                <dd className="text-right">{dict.ui.shippingCarrier}</dd>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <dt className="font-semibold">{dict.cart.itemsLabel(cartCount)}</dt>
                <dd className="num text-[28px] font-semibold tracking-[-0.02em]">{formatUAH(cartTotal)}</dd>
              </div>
            </dl>
            <p className="text-[13px] text-fg-2">{dict.ui.shippingNote}</p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-4">
          <p className="num shrink-0 text-lg font-semibold">{formatUAH(cartTotal)}</p>
          {submitButton("flex-1")}
        </div>
      </div>
    </Container>
  );
}
