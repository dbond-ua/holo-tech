import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_BOOTSTRAP_SECRET, IS_DB_CONFIGURED } from "@/lib/env";
import { getDb } from "@/lib/db/client";
import { describeDbError } from "@/lib/db/errors";
import { hashPassword } from "@/lib/admin-auth";

/**
 * One-time "create the first administrator" endpoint — replaces the manual
 * "run psql locally, then paste an INSERT" step with a single request the
 * project owner makes themselves, after setting ADMIN_BOOTSTRAP_SECRET (see
 * ШАГ 7 in the README/VPS instructions).
 *
 * Deliberately narrow, so this can never become a standing "create an admin"
 * backdoor:
 *  - Refuses outright unless ADMIN_BOOTSTRAP_SECRET is set in the server's
 *    own environment (never committed, never has a default) AND the request
 *    presents the exact same value. Leaving the env var unset — the default
 *    — disables this route completely.
 *  - Refuses once a manager already exists. There is no "first admin" to
 *    bootstrap once one exists; add further managers directly in
 *    /admin (a future admin-management screen) or via SQL, not here.
 *  - The password is hashed with the same scrypt-based hashPassword() the
 *    login flow verifies against (src/lib/admin-auth.ts) — never stored or
 *    logged in plain text, and never echoed back in the response.
 *
 * Usage (run this yourself — from your own terminal, not sent to anyone —
 * so your chosen password never leaves your machine in plain text):
 *   curl -X POST https://<your-site>/api/admin/bootstrap \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"<ADMIN_BOOTSTRAP_SECRET>","name":"Имя","email":"you@example.com","password":"..."}'
 */

function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

export async function POST(request: Request) {
  if (!ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "bootstrap_disabled" }, { status: 503 });
  }
  if (!IS_DB_CONFIGURED) {
    return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const secret = typeof body?.secret === "string" ? body.secret : "";
  if (!secret || !safeEqual(secret, ADMIN_BOOTSTRAP_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  if (!email.includes("@")) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  const sql = getDb();
  if (!sql) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  try {
    const [{ count }] = await sql<{ count: string }[]>`select count(*) as count from managers`;
    if (Number(count) > 0) {
      return NextResponse.json({ error: "already_initialized" }, { status: 409 });
    }

    await sql`
      insert into managers (name, email, password_hash, role, is_active)
      values (${name}, ${email}, ${hashPassword(password)}, 'admin', true)
    `;
  } catch (err) {
    console.error("[admin/bootstrap] failed to create manager", describeDbError(err), err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}
