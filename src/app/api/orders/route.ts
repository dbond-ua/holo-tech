import { NextResponse } from "next/server";
import { createOrder, type CreateOrderInput } from "@/lib/orders";
import type { DeliveryMethod } from "@/lib/db/types";
import { normalizeUaPhone } from "@/lib/phone";

const DELIVERY_METHODS: DeliveryMethod[] = ["np_warehouse", "np_poshtomat", "courier"];

interface RawBody {
  name?: unknown;
  phone?: unknown;
  city?: unknown;
  deliveryMethod?: unknown;
  npCityRef?: unknown;
  npCityName?: unknown;
  npWarehouseRef?: unknown;
  npWarehouseName?: unknown;
  courierAddress?: unknown;
  comment?: unknown;
  items?: unknown;
  utm?: unknown;
  landingPath?: unknown;
  locale?: unknown;
}

/**
 * Server-side validation for the lead-capture checkout form. Never trust the
 * client: every field is re-checked here regardless of what the UI already
 * validated, per the project's security requirements.
 */
function validate(body: RawBody): { input: CreateOrderInput } | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const deliveryMethod = DELIVERY_METHODS.includes(body.deliveryMethod as DeliveryMethod)
    ? (body.deliveryMethod as DeliveryMethod)
    : null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (name.length < 2) return { error: "invalid_name" };

  // Phone: re-run the same Ukrainian-mobile normalization the client uses —
  // never trust a client-computed "already normalized" value. Only the
  // server's own result is ever stored.
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const { normalized: phone, error: phoneError } = normalizeUaPhone(rawPhone);
  if (!phone || phoneError) return { error: "invalid_phone" };

  if (!deliveryMethod) return { error: "invalid_delivery_method" };

  // Nova Poshta deliveries must carry a real city + branch selected from the
  // API-backed picker (a Ref, not free text) — never accept an arbitrary
  // city/branch string typed into the form. Courier deliveries need a real
  // address instead.
  const npCityRef = typeof body.npCityRef === "string" ? body.npCityRef.trim() : "";
  const npWarehouseRef = typeof body.npWarehouseRef === "string" ? body.npWarehouseRef.trim() : "";
  const courierAddress = typeof body.courierAddress === "string" ? body.courierAddress.trim() : "";
  if (deliveryMethod === "np_warehouse" || deliveryMethod === "np_poshtomat") {
    if (!npCityRef) return { error: "invalid_city" };
    if (!npWarehouseRef) return { error: "invalid_warehouse" };
  } else if (deliveryMethod === "courier") {
    if (courierAddress.length < 4) return { error: "invalid_address" };
  }

  if (items.length === 0) return { error: "empty_cart" };

  const cleanItems = items
    .map((raw) => {
      const item = raw as Record<string, unknown>;
      const price = Number(item.price);
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 1)));
      const nameUk = typeof item.nameUk === "string" ? item.nameUk : "";
      const nameEn = typeof item.nameEn === "string" ? item.nameEn : nameUk;
      if (!nameUk || !Number.isFinite(price) || price <= 0) return null;
      return {
        productId: typeof item.productId === "string" ? item.productId : undefined,
        kitId: typeof item.kitId === "string" ? item.kitId : undefined,
        nameUk,
        nameEn,
        price,
        qty,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  if (cleanItems.length === 0) return { error: "empty_cart" };

  const rawUtm = (body.utm ?? {}) as Record<string, unknown>;
  const utm = {
    source: typeof rawUtm.source === "string" ? rawUtm.source.slice(0, 200) : undefined,
    medium: typeof rawUtm.medium === "string" ? rawUtm.medium.slice(0, 200) : undefined,
    campaign: typeof rawUtm.campaign === "string" ? rawUtm.campaign.slice(0, 200) : undefined,
    content: typeof rawUtm.content === "string" ? rawUtm.content.slice(0, 200) : undefined,
    term: typeof rawUtm.term === "string" ? rawUtm.term.slice(0, 200) : undefined,
  };

  return {
    input: {
      name: name.slice(0, 200),
      phone,
      city: typeof body.city === "string" ? body.city.slice(0, 200) : undefined,
      deliveryMethod,
      npCityRef: npCityRef || undefined,
      npCityName: typeof body.npCityName === "string" ? body.npCityName.slice(0, 200) : undefined,
      npWarehouseRef: npWarehouseRef || undefined,
      npWarehouseName: typeof body.npWarehouseName === "string" ? body.npWarehouseName.slice(0, 300) : undefined,
      courierAddress: courierAddress ? courierAddress.slice(0, 300) : undefined,
      comment: typeof body.comment === "string" ? body.comment.slice(0, 1000) : undefined,
      items: cleanItems,
      utm,
      landingPath: typeof body.landingPath === "string" ? body.landingPath.slice(0, 300) : undefined,
      // Never trust a client-sent language for anything sensitive — this only
      // seeds the customer's remembered delivery language, so a narrow
      // allowlist is enough (mirrors the `language` check constraint added in
      // migrations/0003_customer_delivery_prefs.sql).
      locale: body.locale === "en" ? "en" : body.locale === "uk" ? "uk" : undefined,
    },
  };
}

export async function POST(request: Request) {
  let body: RawBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = validate(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const { order, items, persisted } = await createOrder(result.input);
    return NextResponse.json({
      orderNumber: order.order_number,
      total: order.total,
      currency: order.currency,
      deliveryMethod: order.delivery_method,
      city: order.city,
      npWarehouseName: order.np_warehouse_name,
      courierAddress: order.courier_address,
      items: items.map((i) => ({ nameUk: i.name_uk, nameEn: i.name_en, price: i.price, qty: i.qty })),
      persisted,
    });
  } catch (err) {
    console.error("[api/orders] unexpected error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
