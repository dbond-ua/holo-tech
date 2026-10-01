import { NextResponse } from "next/server";
import { CRON_SECRET, IS_DB_CONFIGURED } from "@/lib/env";
import { getDb } from "@/lib/db/client";
import { describeDbError } from "@/lib/db/errors";
import { sendReminderMessage } from "@/lib/telegram";
import type { OrderRow } from "@/lib/db/types";

/**
 * Non-spammy reminder sweep for unprocessed ("new") orders. Call this
 * endpoint on a schedule (a system cron job hitting curl, or any external
 * scheduler) — e.g. every 5 minutes:
 *   GET /api/cron/reminders?secret=<CRON_SECRET>
 *
 * Behaviour:
 *  - Only orders still in "new" status are reminded — any status change
 *    (including "postponed", which has its own callback time) clears
 *    next_reminder_at, so this sweep naturally stops nagging once a manager
 *    has touched the order.
 *  - Reminder cadence escalates using settings.reminder_intervals_minutes
 *    (default [15, 60, 240] — first reminder 15 min after creation, then
 *    hourly, then every 4h) instead of firing on a fixed short interval
 *    forever, so managers aren't spammed for stale leads.
 */

const DEFAULT_INTERVALS_MINUTES = [15, 60, 240];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (CRON_SECRET && searchParams.get("secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!IS_DB_CONFIGURED) {
    return NextResponse.json({ ok: true, skipped: "db-not-configured", reminded: 0 });
  }
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ ok: true, skipped: "db-not-configured", reminded: 0 });
  }

  let intervals: number[] = DEFAULT_INTERVALS_MINUTES;
  let dueOrders: OrderRow[] = [];

  try {
    const [settingsRow] = await sql<{ value: unknown }[]>`
      select value from settings where key = 'reminder_intervals_minutes'
    `;
    if (Array.isArray(settingsRow?.value)) intervals = settingsRow.value as number[];

    dueOrders = await sql<OrderRow[]>`
      select * from orders
      where status = 'new' and next_reminder_at is not null and next_reminder_at <= now()
    `;
  } catch (err) {
    console.error("[cron/reminders] failed to query due orders", describeDbError(err), err);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  let reminded = 0;

  for (const row of dueOrders) {
    await sendReminderMessage(row).catch((err) => console.error("[cron/reminders] send failed", err));

    const nextCount = row.reminder_count + 1;
    const nextIntervalMinutes = intervals[Math.min(nextCount, intervals.length - 1)];
    const nextReminderAt =
      nextCount >= intervals.length + 2 // stop after a reasonable number of escalations
        ? null
        : new Date(Date.now() + nextIntervalMinutes * 60_000).toISOString();

    try {
      await sql`
        update orders
        set reminder_count = ${nextCount}, last_reminded_at = ${nowIso}, next_reminder_at = ${nextReminderAt}
        where id = ${row.id}
      `;
      reminded += 1;
    } catch (err) {
      console.error(`[cron/reminders] failed to update reminder bookkeeping for order ${row.id}`, describeDbError(err), err);
    }
  }

  return NextResponse.json({ ok: true, reminded });
}
