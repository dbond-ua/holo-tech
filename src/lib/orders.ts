import "server-only";
import type { Sql } from "@/lib/db/client";
import { getDb, withTransaction } from "@/lib/db/client";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { sendOrderNotification, updateOrderMessage } from "@/lib/telegram";
import { describeDbError } from "@/lib/db/errors";
import type { OrderRow, OrderItemRow, OrderStatus, DeliveryMethod } from "@/lib/db/types";

/**
 * Applies a stock change for every stock-tracked item in an order, through
 * the atomic adjust_stock() SQL function (see migrations/0001_init.sql) —
 * never a local read-modify-write, so concurrent order submissions can't
 * race each other into a negative or over-reserved balance. `sql` is always
 * a transaction-scoped client (the tx argument from sql.begin()) so this
 * runs as part of the same all-or-nothing unit of work as the order/items
 * insert around it.
 *
 *  - "reserve": order just submitted — hold the qty (stock_reserved += qty),
 *    without touching the physical count yet.
 *  - "confirm": manager confirmed the order — convert the reservation into a
 *    real deduction (stock_count -= qty, stock_reserved -= qty).
 *  - "release": order cancelled before it was ever confirmed — give back the
 *    reservation only (stock_reserved -= qty), stock_count is untouched.
 *  - "restock": a *confirmed* order was later cancelled — the units were
 *    already deducted, so return them to stock_count.
 *
 * Kit items (kit_id set, product_id null) and products that don't have
 * stock tracking enabled (stock_count is null — the default) are skipped
 * entirely, preserving the existing "unlimited/manual" behaviour for any
 * product the admin hasn't opted into inventory tracking for.
 */
async function adjustStockForItems(
  sql: Sql,
  items: Pick<OrderItemRow, "product_id" | "qty">[],
  kind: "reserve" | "confirm" | "release" | "restock",
  orderId: string,
  managerName?: string | null
): Promise<void> {
  for (const item of items) {
    if (!item.product_id || item.qty <= 0) continue;

    const [product] = await sql<{ id: string; stock_count: number | null }[]>`
      select id, stock_count from products where id = ${item.product_id}
    `;
    if (!product || product.stock_count === null || product.stock_count === undefined) continue;

    const stockDelta = kind === "confirm" ? -item.qty : kind === "restock" ? item.qty : 0;
    const reservedDelta =
      kind === "reserve" ? item.qty : kind === "confirm" || kind === "release" ? -item.qty : 0;
    const reason =
      kind === "reserve"
        ? "order_reserved"
        : kind === "confirm"
          ? "order_confirmed"
          : kind === "restock"
            ? "order_restocked"
            : "order_cancelled";

    try {
      await sql`
        select * from adjust_stock(
          ${item.product_id}, ${stockDelta}, ${reservedDelta}, ${reason}, ${orderId}, null, ${managerName ?? null}, null
        )
      `;
    } catch (err) {
      console.error(`[orders] adjust_stock (${kind}) failed for product ${item.product_id}`, describeDbError(err), err);
      throw err; // propagate — the caller is inside a transaction and this must roll back the whole order
    }
  }
}

export interface CreateOrderItemInput {
  productId?: string;
  kitId?: string;
  nameUk: string;
  nameEn: string;
  price: number;
  qty: number;
}

export interface CreateOrderInput {
  name: string;
  phone: string;
  city?: string;
  deliveryMethod: DeliveryMethod;
  npCityRef?: string;
  npCityName?: string;
  npWarehouseRef?: string;
  npWarehouseName?: string;
  courierAddress?: string;
  comment?: string;
  locale?: "uk" | "en";
  items: CreateOrderItemInput[];
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  landingPath?: string;
}

export interface CreateOrderResult {
  order: OrderRow;
  items: OrderItemRow[];
  persisted: boolean; // false when the database isn't configured — demo mode
}

/** Demo-mode fallback only (no database configured) — human-readable but not
 *  guaranteed unique/sequential the way next_order_number() is. Whenever the
 *  database IS configured, the real order number instead comes from the
 *  next_order_number() SQL function (migrations/0004_order_numbering.sql),
 *  which generates it atomically under a row lock so two orders submitted at
 *  the same instant can never collide — see createOrder() below. */
function generateDemoOrderNumber(): string {
  const day = new Date();
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100); // 3-digit, matches TB-YYYYMMDD-NNN shape
  return `TB-${y}${m}${d}-${rand}`;
}

const FIRST_REMINDER_MINUTES = 15;

/**
 * Creates an order. When the database is configured, the customer upsert,
 * order insert, order_items insert, stock reservation, and status-history
 * insert all run inside ONE Postgres transaction (sql.begin()) — either
 * everything commits together or, if any step throws (a constraint
 * violation, a lost connection, adjust_stock failing), the whole thing rolls
 * back and nothing is half-written. This is the "transactions for order
 * creation" requirement: the previous Supabase-REST implementation issued
 * these as separate awaited calls with no such guarantee.
 *
 * Falls back to an in-memory (non-persisted) order when the database isn't
 * configured, or if the transaction itself fails — a checkout should never
 * hard-fail the customer just because the order couldn't be written; the
 * Telegram notification still fires either way so a manager can follow up
 * manually, and `persisted: false` tells the caller this happened.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const subtotal = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const nowIso = new Date().toISOString();
  const nextReminderAt = new Date(Date.now() + FIRST_REMINDER_MINUTES * 60_000).toISOString();

  const baseOrder: OrderRow = {
    id: crypto.randomUUID(),
    order_number: generateDemoOrderNumber(),
    customer_id: null,
    name: input.name,
    phone: input.phone,
    city: input.city ?? input.npCityName ?? null,
    delivery_method: input.deliveryMethod,
    np_city_ref: input.npCityRef ?? null,
    np_city_name: input.npCityName ?? null,
    np_warehouse_ref: input.npWarehouseRef ?? null,
    np_warehouse_name: input.npWarehouseName ?? null,
    courier_address: input.courierAddress ?? null,
    comment: input.comment ?? null,
    language: input.locale ?? null,
    subtotal,
    total: subtotal,
    currency: "UAH",
    status: "new",
    postponed_until: null,
    utm_source: input.utm?.source ?? null,
    utm_medium: input.utm?.medium ?? null,
    utm_campaign: input.utm?.campaign ?? null,
    utm_content: input.utm?.content ?? null,
    utm_term: input.utm?.term ?? null,
    landing_path: input.landingPath ?? null,
    reminder_count: 0,
    last_reminded_at: null,
    next_reminder_at: nextReminderAt,
    telegram_chat_id: null,
    telegram_message_id: null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const items: OrderItemRow[] = input.items.map((i) => ({
    id: crypto.randomUUID(),
    order_id: baseOrder.id,
    product_id: i.productId ?? null,
    kit_id: i.kitId ?? null,
    name_uk: i.nameUk,
    name_en: i.nameEn,
    price: i.price,
    qty: i.qty,
    created_at: nowIso,
  }));

  let order = baseOrder;
  let persisted = false;

  if (IS_DB_CONFIGURED) {
    try {
      const result = await withTransaction(async (tx) => {
        const [{ next_order_number: orderNumber }] = await tx<{ next_order_number: string }[]>`
          select next_order_number()
        `;

        // Upsert the customer by phone so repeat leads collapse into one
        // record. Delivery prefs (city_ref/warehouse/warehouse_ref/language
        // — migrations/0003_customer_delivery_prefs.sql) are overwritten
        // with this order's values every time, so the customer record
        // always reflects their *most recent* choice, ready to prefill next
        // time they order.
        const [customer] = await tx<{ id: string }[]>`
          insert into customers (name, phone, city, city_ref, warehouse, warehouse_ref, language)
          values (${input.name}, ${input.phone}, ${baseOrder.city}, ${input.npCityRef ?? null}, ${input.npWarehouseName ?? null}, ${input.npWarehouseRef ?? null}, ${input.locale ?? null})
          on conflict (phone) do update set
            name = excluded.name,
            city = excluded.city,
            city_ref = excluded.city_ref,
            warehouse = excluded.warehouse,
            warehouse_ref = excluded.warehouse_ref,
            language = excluded.language
          returning id
        `;

        const [insertedOrder] = await tx<OrderRow[]>`
          insert into orders (
            id, order_number, customer_id, name, phone, city, delivery_method,
            np_city_ref, np_city_name, np_warehouse_ref, np_warehouse_name, courier_address,
            comment, language, subtotal, total, currency, status,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_path,
            reminder_count, next_reminder_at
          ) values (
            ${baseOrder.id}, ${orderNumber}, ${customer?.id ?? null}, ${input.name}, ${input.phone}, ${baseOrder.city}, ${input.deliveryMethod},
            ${input.npCityRef ?? null}, ${input.npCityName ?? null}, ${input.npWarehouseRef ?? null}, ${input.npWarehouseName ?? null}, ${input.courierAddress ?? null},
            ${input.comment ?? null}, ${input.locale ?? null}, ${subtotal}, ${subtotal}, 'UAH', 'new',
            ${input.utm?.source ?? null}, ${input.utm?.medium ?? null}, ${input.utm?.campaign ?? null}, ${input.utm?.content ?? null}, ${input.utm?.term ?? null}, ${input.landingPath ?? null},
            0, ${nextReminderAt}
          )
          returning *
        `;

        for (const item of items) {
          await tx`
            insert into order_items (id, order_id, product_id, kit_id, name_uk, name_en, price, qty)
            values (${item.id}, ${insertedOrder.id}, ${item.product_id}, ${item.kit_id}, ${item.name_uk}, ${item.name_en}, ${item.price}, ${item.qty})
          `;
        }

        // Reserve stock for tracked products so it isn't oversold while the
        // order sits unconfirmed — converted to a real deduction on
        // "confirmed", released on "cancelled" (see updateOrderStatus below).
        await adjustStockForItems(tx, items, "reserve", insertedOrder.id, null);

        await tx`
          insert into order_status_history (order_id, from_status, to_status, manager_id, manager_name, note, source)
          values (${insertedOrder.id}, null, 'new', null, null, null, 'system')
        `;

        return insertedOrder;
      });

      order = result;
      persisted = true;
    } catch (err) {
      console.error("[orders] order transaction failed, continuing in demo mode for this request", describeDbError(err), err);
    }
  }

  // Telegram notification — best effort, never blocks order creation.
  const telegram = await sendOrderNotification(order, items).catch((err) => {
    console.error("[orders] telegram notification failed", err);
    return null;
  });

  if (telegram && persisted) {
    const sql = getDb();
    if (sql) {
      try {
        await sql`
          update orders set telegram_chat_id = ${telegram.chatId}, telegram_message_id = ${telegram.messageId}
          where id = ${order.id}
        `;
      } catch (err) {
        console.error("[orders] failed to store telegram message ids", describeDbError(err), err);
      }
    }
    order = { ...order, telegram_chat_id: telegram.chatId, telegram_message_id: telegram.messageId };
  } else if (telegram) {
    order = { ...order, telegram_chat_id: telegram.chatId, telegram_message_id: telegram.messageId };
  }

  return { order, items, persisted };
}

export async function getOrderByNumber(orderNumber: string): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;

  const [order] = await sql<OrderRow[]>`select * from orders where order_number = ${orderNumber}`;
  if (!order) return null;
  const items = await sql<OrderItemRow[]>`select * from order_items where order_id = ${order.id}`;
  return { order, items };
}

export async function getOrderById(orderId: string): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;

  const [order] = await sql<OrderRow[]>`select * from orders where id = ${orderId}`;
  if (!order) return null;
  const items = await sql<OrderItemRow[]>`select * from order_items where order_id = ${order.id}`;
  return { order, items };
}

export interface UpdateStatusOptions {
  managerId?: string | null;
  managerName?: string | null;
  note?: string | null;
  source: "admin" | "telegram" | "system";
  postponedUntil?: string | null;
}

/** Central place that changes an order's status: updates the row, logs
 *  history, clears/sets reminder bookkeeping, and adjusts stock — all inside
 *  one transaction, so a status change is never left half-applied (e.g. the
 *  order marked "confirmed" but the stock deduction lost). Used by both the
 *  admin panel and the Telegram webhook so behaviour never drifts between
 *  the two entry points. The Telegram message edit happens after the
 *  transaction commits (best effort, never rolls back the status change). */
export async function updateOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  opts: UpdateStatusOptions
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  if (!IS_DB_CONFIGURED) return null;

  let result: { order: OrderRow; items: OrderItemRow[] } | null = null;
  try {
    result = await withTransaction(async (tx) => {
      const [current] = await tx<OrderRow[]>`select * from orders where id = ${orderId}`;
      if (!current) return null;
      const fromStatus = current.status;

      const orderItems = await tx<OrderItemRow[]>`select * from order_items where order_id = ${orderId}`;

      const isTerminal = toStatus === "confirmed" || toStatus === "cancelled";
      const postponedUntil = toStatus === "postponed" ? opts.postponedUntil ?? null : null;
      const nextReminderAt = isTerminal || toStatus !== "new" ? null : current.next_reminder_at;

      const [updated] = await tx<OrderRow[]>`
        update orders
        set status = ${toStatus}, postponed_until = ${postponedUntil}, next_reminder_at = ${nextReminderAt}
        where id = ${orderId}
        returning *
      `;
      if (!updated) return null;

      await tx`
        insert into order_status_history (order_id, from_status, to_status, manager_id, manager_name, note, source)
        values (${orderId}, ${fromStatus}, ${toStatus}, ${opts.managerId ?? null}, ${opts.managerName ?? null}, ${opts.note ?? null}, ${opts.source})
      `;

      // Reservation -> real deduction on confirm; release/return on cancel,
      // depending on whether the units had already been deducted (see the
      // adjustStockForItems doc comment above for the full state machine).
      if (toStatus === "confirmed" && fromStatus !== "confirmed") {
        await adjustStockForItems(tx, orderItems, "confirm", orderId, opts.managerName ?? null);
      } else if (toStatus === "cancelled" && fromStatus !== "cancelled") {
        await adjustStockForItems(
          tx,
          orderItems,
          fromStatus === "confirmed" ? "restock" : "release",
          orderId,
          opts.managerName ?? null
        );
      }

      return { order: updated, items: orderItems };
    });
  } catch (err) {
    console.error("[orders] status update transaction failed", describeDbError(err), err);
    return null;
  }

  if (!result) return null;

  await updateOrderMessage(result.order, result.items).catch((err) =>
    console.error("[orders] failed to edit telegram message", err)
  );

  return result;
}
