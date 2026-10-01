import { NextResponse } from "next/server";
import { TELEGRAM_WEBHOOK_SECRET } from "@/lib/env";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { answerCallbackQuery, sendPostponeTimePicker } from "@/lib/telegram";
import type { OrderStatus } from "@/lib/db/types";

/**
 * Telegram webhook endpoint. Configure it with:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SITE_URL>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
 * Telegram then sends every update (including inline button presses, as
 * `callback_query`) to this route, with the secret token in the
 * `X-Telegram-Bot-Api-Secret-Token` header so we can verify the request
 * actually came from Telegram and not a random POST to a guessable URL.
 */

const ACTION_TO_STATUS: Record<string, OrderStatus> = {
  call: "called",
  contact: "contacted",
  confirm: "confirmed",
  cancel: "cancelled",
};

interface TelegramUpdate {
  callback_query?: {
    id: string;
    data?: string;
    from?: { id: number; first_name?: string; username?: string };
    message?: { chat: { id: number } };
  };
}

export async function POST(request: Request) {
  if (TELEGRAM_WEBHOOK_SECRET) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignore malformed bodies, Telegram doesn't retry on 200
  }

  const cq = update.callback_query;
  if (!cq?.data) return NextResponse.json({ ok: true });

  const managerName = cq.from?.username ? `@${cq.from.username}` : cq.from?.first_name ?? "manager";

  const [action, orderId, extra] = cq.data.split(":");

  try {
    if (action === "postpone") {
      // Step 1 of the postpone sub-flow: show a small time picker instead of
      // immediately changing status.
      const chatId = cq.message?.chat.id;
      if (chatId) await sendPostponeTimePicker(String(chatId), orderId);
      await answerCallbackQuery(cq.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "postpone-set") {
      const minutes = Number(extra) || 60;
      const postponedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
      await updateOrderStatus(orderId, "postponed", {
        managerName,
        source: "telegram",
        postponedUntil,
        note: `Callback in ${minutes} min`,
      });
      await answerCallbackQuery(cq.id, "Позначено — передзвонити пізніше");
      return NextResponse.json({ ok: true });
    }

    const toStatus = ACTION_TO_STATUS[action];
    if (!toStatus) {
      await answerCallbackQuery(cq.id);
      return NextResponse.json({ ok: true });
    }

    const existing = await getOrderById(orderId);
    if (!existing) {
      await answerCallbackQuery(cq.id, "Замовлення не знайдено");
      return NextResponse.json({ ok: true });
    }

    await updateOrderStatus(orderId, toStatus, { managerName, source: "telegram" });
    await answerCallbackQuery(cq.id, "Готово");
  } catch (err) {
    console.error("[telegram-webhook] failed to process callback_query", err);
    await answerCallbackQuery(cq.id, "Сталася помилка").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
