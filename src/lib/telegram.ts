import "server-only";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, IS_TELEGRAM_CONFIGURED } from "@/lib/env";
import type { OrderRow, OrderItemRow, OrderStatus } from "@/lib/db/types";
import { formatUaPhoneDisplay } from "@/lib/phone";

const API_BASE = "https://api.telegram.org";

const DELIVERY_LABEL: Record<string, string> = {
  np_warehouse: "Нова Пошта — відділення",
  np_poshtomat: "Нова Пошта — поштомат",
  courier: "Кур'єром",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "🆕 Новий",
  called: "📞 Подзвонив",
  contacted: "✅ Зв'язався",
  postponed: "⏰ Передзвонити пізніше",
  confirmed: "✔️ Підтверджено",
  cancelled: "✖️ Скасовано",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatOrderMessage(order: OrderRow, items: OrderItemRow[]): string {
  const lines: string[] = [];
  lines.push(`<b>Нове замовлення ${escapeHtml(order.order_number)}</b>`);
  lines.push(`Статус: ${STATUS_LABEL[order.status]}`);
  lines.push("");
  lines.push(`👤 ${escapeHtml(order.name)}`);
  lines.push(`📱 ${escapeHtml(formatUaPhoneDisplay(order.phone))}`);
  if (order.city) lines.push(`🏙 ${escapeHtml(order.city)}`);
  lines.push("");
  lines.push(`🚚 ${DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method}`);
  if (order.np_warehouse_name) lines.push(`   ${escapeHtml(order.np_warehouse_name)}`);
  if (order.courier_address) lines.push(`   ${escapeHtml(order.courier_address)}`);
  lines.push("");
  lines.push("<b>Товари:</b>");
  for (const item of items) {
    lines.push(`• ${escapeHtml(item.name_uk)} × ${item.qty} — ${item.price * item.qty} ${order.currency}`);
  }
  lines.push("");
  lines.push(`<b>Разом: ${order.total} ${order.currency}</b>`);
  if (order.comment) {
    lines.push("");
    lines.push(`💬 ${escapeHtml(order.comment)}`);
  }
  if (order.utm_source || order.utm_campaign) {
    lines.push("");
    const utmParts = [
      order.utm_source && `source=${order.utm_source}`,
      order.utm_medium && `medium=${order.utm_medium}`,
      order.utm_campaign && `campaign=${order.utm_campaign}`,
    ].filter(Boolean);
    if (utmParts.length) lines.push(`📊 ${utmParts.join(", ")}`);
  }
  return lines.join("\n");
}

/** callback_data payload format: "<action>:<orderId>" — Telegram caps callback_data at 64 bytes,
 *  so we keep it to a short action code plus the raw order UUID. */
export type TelegramAction = "call" | "contact" | "postpone" | "confirm" | "cancel";

export function buildOrderKeyboard(orderId: string, status: OrderStatus) {
  if (status === "confirmed" || status === "cancelled") {
    return { inline_keyboard: [] as unknown[] };
  }
  const row1 = [
    { text: "📞 Подзвонив", callback_data: `call:${orderId}` },
    { text: "💬 Зв'язався", callback_data: `contact:${orderId}` },
  ];
  const row2 = [
    { text: "⏰ Передзвонити пізніше", callback_data: `postpone:${orderId}` },
  ];
  const row3 = [
    { text: "✅ Підтвердити", callback_data: `confirm:${orderId}` },
    { text: "❌ Скасувати", callback_data: `cancel:${orderId}` },
  ];
  return { inline_keyboard: [row1, row2, row3] };
}

async function callTelegram(method: string, body: Record<string, unknown>) {
  if (!IS_TELEGRAM_CONFIGURED) {
    return { ok: false, skipped: true as const, reason: "telegram-not-configured" };
  }
  const res = await fetch(`${API_BASE}/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    console.error(`[telegram] ${method} failed`, json ?? res.statusText);
  }
  return json ?? { ok: false };
}

/** Sends the initial order notification. Returns the Telegram message_id (to
 *  store on the order for later edits), or null if Telegram isn't configured
 *  or the call failed — callers must not treat that as fatal. */
export async function sendOrderNotification(
  order: OrderRow,
  items: OrderItemRow[]
): Promise<{ chatId: string; messageId: number } | null> {
  const result = await callTelegram("sendMessage", {
    chat_id: TELEGRAM_CHAT_ID,
    text: formatOrderMessage(order, items),
    parse_mode: "HTML",
    reply_markup: buildOrderKeyboard(order.id, order.status),
  });
  if (!result?.ok || !result.result?.message_id) return null;
  return { chatId: String(TELEGRAM_CHAT_ID), messageId: result.result.message_id };
}

/** Edits an existing order notification in place (status changed) — used by
 *  the webhook handler and the admin panel so the Telegram thread always
 *  reflects the latest status instead of spamming new messages. */
export async function updateOrderMessage(order: OrderRow, items: OrderItemRow[]): Promise<void> {
  if (!order.telegram_chat_id || !order.telegram_message_id) return;
  await callTelegram("editMessageText", {
    chat_id: order.telegram_chat_id,
    message_id: order.telegram_message_id,
    text: formatOrderMessage(order, items),
    parse_mode: "HTML",
    reply_markup: buildOrderKeyboard(order.id, order.status),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

/** Sends a plain reminder message (not an edit) so it surfaces as a fresh
 *  notification even if the original message scrolled out of view. */
export async function sendReminderMessage(order: OrderRow): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: TELEGRAM_CHAT_ID,
    text: `⏰ Нагадування: замовлення <b>${escapeHtml(order.order_number)}</b> (${escapeHtml(
      order.name
    )}, ${escapeHtml(formatUaPhoneDisplay(order.phone))}) досі не оброблено.`,
    parse_mode: "HTML",
    reply_markup: buildOrderKeyboard(order.id, order.status),
  });
}

/** Sends a small inline time-picker for the "call back later" sub-flow. */
export async function sendPostponeTimePicker(chatId: string, orderId: string): Promise<void> {
  const options = [30, 60, 120, 240];
  await callTelegram("sendMessage", {
    chat_id: chatId,
    text: "Через скільки перетелефонувати?",
    reply_markup: {
      inline_keyboard: [
        options.map((mins) => ({
          text: mins < 60 ? `${mins} хв` : `${mins / 60} год`,
          callback_data: `postpone-set:${orderId}:${mins}`,
        })),
      ],
    },
  });
}
