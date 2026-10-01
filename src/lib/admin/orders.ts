import "server-only";
import { getDb } from "@/lib/db/client";
import { IS_DB_CONFIGURED } from "@/lib/env";
import { describeDbError } from "@/lib/db/errors";
import type { OrderRow, OrderItemRow, OrderStatusHistoryRow, OrderStatus } from "@/lib/db/types";

export async function listOrders(filter?: { status?: OrderStatus }): Promise<OrderRow[]> {
  if (!IS_DB_CONFIGURED) return [];
  const sql = getDb();
  if (!sql) return [];
  try {
    if (filter?.status) {
      return await sql<OrderRow[]>`
        select * from orders where status = ${filter.status} order by created_at desc
      `;
    }
    return await sql<OrderRow[]>`select * from orders order by created_at desc`;
  } catch (err) {
    console.error("[admin/orders] listOrders failed", describeDbError(err), err);
    return [];
  }
}

export async function getOrderDetail(
  id: string
): Promise<{ order: OrderRow; items: OrderItemRow[]; history: OrderStatusHistoryRow[] } | null> {
  if (!IS_DB_CONFIGURED) return null;
  const sql = getDb();
  if (!sql) return null;

  try {
    const [order] = await sql<OrderRow[]>`select * from orders where id = ${id}`;
    if (!order) return null;
    const items = await sql<OrderItemRow[]>`select * from order_items where order_id = ${id}`;
    const history = await sql<OrderStatusHistoryRow[]>`
      select * from order_status_history where order_id = ${id} order by created_at asc
    `;
    return { order, items, history };
  } catch (err) {
    console.error("[admin/orders] getOrderDetail failed", describeDbError(err), err);
    return null;
  }
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const empty: Record<OrderStatus, number> = {
    new: 0,
    called: 0,
    contacted: 0,
    postponed: 0,
    confirmed: 0,
    cancelled: 0,
  };
  if (!IS_DB_CONFIGURED) return empty;
  const sql = getDb();
  if (!sql) return empty;

  try {
    const rows = await sql<{ status: OrderStatus }[]>`select status from orders`;
    for (const row of rows) {
      empty[row.status] = (empty[row.status] ?? 0) + 1;
    }
  } catch (err) {
    console.error("[admin/orders] countOrdersByStatus failed", describeDbError(err), err);
  }
  return empty;
}
