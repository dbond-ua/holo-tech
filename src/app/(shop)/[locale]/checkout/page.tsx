"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Package, Truck } from "lucide-react";
import { useStore } from "@/context/CartContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { Button, buttonVariants } from "@/components/ui/Button";
import { PhoneInput } from "@/components/checkout/PhoneInput";
import { Combobox, type ComboboxItem } from "@/components/checkout/Combobox";
import { formatUAH, cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { getStoredUtm, getLandingPath } from "@/lib/utm";
import { normalizeUaPhone } from "@/lib/phone";
import { localePath } from "@/i18n/localePath";
import type { DeliveryMethod } from "@/lib/db/types";

const inputClass =
  "w-full rounded-xl2 border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus-visible:border-ink dark:border-line-dark dark:focus-visible:border-white disabled:opacity-50";
const labelClass = "mb-1.5 block text-sm font-medium";

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
      <Container className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-xl font-semibold">{dict.checkout.emptyTitle}</h1>
        <p className="mt-2 text-sm text-muted dark:text-muted-dark">{dict.checkout.emptyText}</p>
        <Link href="/stations" className={buttonVariants({ className: "mt-6" })}>
          {dict.cart.goToCatalog}
        </Link>
      </Container>
    );
  }

  const deliveryOptions: { key: DeliveryMethod; label: string; icon: typeof Store }[] = [
    { key: "np_warehouse", label: dict.checkout.methodNpWarehouse, icon: Store },
    { key: "np_poshtomat", label: dict.checkout.methodNpPoshtomat, icon: Package },
    { key: "courier", label: dict.checkout.methodCourier, icon: Truck },
  ];

  const cityComboboxItems: ComboboxItem[] = cityResults.map((c) => ({
    ref: c.ref,
    label: c.name,
    sublabel: c.area,
  }));

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.checkout.title}</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6 rounded-xl2 border border-line p-6 dark:border-line-dark">
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">{dict.checkout.contactsTitle}</h2>
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
                <p className="mt-1.5 text-xs text-ember">
                  {phoneResult.error === "invalid_prefix" ? dict.checkout.phoneErrorPrefix : dict.checkout.phoneErrorIncomplete}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-line pt-6 dark:border-line-dark">
            <h2 className="text-base font-semibold">{dict.checkout.deliveryTitle}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {deliveryOptions.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    update("deliveryMethod", m.key);
                    update("npWarehouseRef", "");
                    update("npWarehouseName", "");
                    update("warehouseQuery", "");
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl2 border p-3.5 text-left text-sm font-medium transition-all",
                    form.deliveryMethod === m.key
                      ? "border-ink bg-black/[0.03] dark:border-white dark:bg-white/[0.06]"
                      : "border-line dark:border-line-dark"
                  )}
                >
                  <m.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
                  {m.label}
                </button>
              ))}
            </div>

            {isNovaPoshta ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div>
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
          </div>

          <div className="border-t border-line pt-6 dark:border-line-dark">
            <label className={labelClass} htmlFor="comment">
              {dict.checkout.commentLabel}
            </label>
            <textarea
              id="comment"
              rows={3}
              className={cn(inputClass, "resize-none")}
              value={form.comment}
              onChange={(e) => update("comment", e.target.value)}
              placeholder={dict.checkout.commentPlaceholder}
            />
          </div>

          {submitError && <p className="text-sm text-ember">{submitError}</p>}

          <Button size="lg" disabled={!isValid || submitting} onClick={handleSubmit}>
            {submitting ? dict.checkout.submitting : dict.checkout.confirmBtn}
          </Button>
        </div>

        <div className="h-fit rounded-xl2 border border-line p-6 dark:border-line-dark">
          <h2 className="text-base font-semibold">{dict.checkout.yourOrderTitle}</h2>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-muted dark:text-muted-dark">
                  {item.name[locale]} × {item.qty}
                </span>
                <span className="shrink-0 font-medium">{formatUAH(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 dark:border-line-dark">
            <span className="font-semibold">{dict.cart.itemsLabel(cartCount)}</span>
            <span className="text-xl font-semibold tracking-tight">{formatUAH(cartTotal)}</span>
          </div>
        </div>
      </div>
    </Container>
  );
}
