import "server-only";
import postgres from "postgres";
import { DATABASE_URL, IS_DB_CONFIGURED } from "@/lib/env";

/**
 * Server-only PostgreSQL client (self-hosted — no managed/cloud provider).
 * Never import this file from a "use client" component; every caller lives
 * in a Route Handler, Server Action, or Server Component.
 *
 * One pooled connection (postgres.js manages its own small connection pool
 * internally — `max` below caps it) shared for the lifetime of the server
 * process, created lazily on first use and reused after that rather than
 * opening a fresh connection per request.
 *
 * All queries go through tagged-template parameters (`` sql`... ${x} ...` ``)
 * everywhere in this codebase — postgres.js parameterizes every interpolated
 * value automatically, so a value never becomes literal SQL text. Never
 * build a query by string concatenation or use `sql.unsafe()` with anything
 * that isn't a fixed, hand-written string — that is the project's SQL
 * injection defense, and it only holds if every call site follows it.
 *
 * Returns null when DATABASE_URL isn't set — every server caller must handle
 * that by falling back to demo behaviour (see IS_DB_CONFIGURED usages
 * throughout src/lib), exactly as the app did before this file existed.
 */

export type Sql = ReturnType<typeof postgres>;

let cached: Sql | null = null;

export function getDb(): Sql | null {
  if (!IS_DB_CONFIGURED) return null;
  if (!cached) {
    cached = postgres(DATABASE_URL, {
      max: 10, // small pool — a single small-store admin panel + storefront + webhook never needs more
      idle_timeout: 20,
      connect_timeout: 10,
      // Local/private-network Postgres (see README) — no TLS between the app
      // and a database on the same VPS. If DATABASE_URL ever points at a
      // Postgres on a different host, add `?sslmode=require` to the
      // connection string rather than flipping this here.
      ssl: false,
    });
  }
  return cached;
}

/**
 * Runs `fn` inside a single Postgres transaction: every query issued through
 * the `sql` argument fn receives commits together, or the whole transaction
 * rolls back if fn throws (postgres.js's sql.begin() behaviour). Use this
 * for any sequence of writes that must all succeed or all fail together —
 * e.g. creating an order (customer + order + order_items + stock reservation
 * + status history all-or-nothing), never a series of separate awaited
 * calls on the plain client.
 */
export async function withTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = getDb();
  if (!sql) throw new Error("db_not_configured");
  // Two separate type mismatches here, both harmless at runtime, both fixed
  // with assertions rather than fighting postgres.js's internal types:
  //  1. `tx` (the transaction-scoped client sql.begin() hands the callback)
  //     is postgres.js's internal `TransactionSql` type, which is missing a
  //     few pool-management members (CLOSE, END, ...) that `Sql` has and
  //     that `fn` never calls — it supports the exact same tagged-template
  //     query calling convention `fn` actually uses, so treating it as `Sql`
  //     here is safe.
  //  2. postgres.js's own `begin<T>()` returns `Promise<UnwrapPromiseArray<T>>`,
  //     and composing that with this function's own unrelated generic `T` is
  //     exactly the kind of generic-through-generic composition TypeScript
  //     can't verify structurally ("T could be instantiated with an
  //     arbitrary type..."). At runtime this just resolves to whatever
  //     fn(tx) resolved to, which is always Promise<T> by fn's own declared
  //     type — safe to assert.
  return sql.begin((tx) => fn(tx as unknown as Sql)) as Promise<T>;
}
