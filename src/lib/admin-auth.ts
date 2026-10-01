import "server-only";
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_SESSION_SECRET, IS_DB_CONFIGURED } from "@/lib/env";
import { getDb } from "@/lib/db/client";
import { describeDbError } from "@/lib/db/errors";
import type { ManagerRow } from "@/lib/db/types";

/**
 * Minimal admin auth: no external auth library (can't install one in this
 * environment), just Node's built-in `crypto` for password hashing
 * (scrypt, same primitive bcrypt/argon2 wrap) and an HMAC-signed session
 * cookie. Good enough for a single small admin panel; swap for a real auth
 * provider later if the team grows.
 *
 * Manager accounts live in the database (`managers` table, password_hash
 * column set via hashPassword below). When the database isn't configured
 * yet, a single demo admin account (env-configurable) keeps the panel
 * usable locally — see ADMIN_DEMO_EMAIL / ADMIN_DEMO_PASSWORD below and
 * change/remove them before going to production.
 */

const SESSION_COOKIE = "holotech_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

const DEMO_EMAIL = process.env.ADMIN_DEMO_EMAIL || "admin@holotech.store";
const DEMO_PASSWORD = process.env.ADMIN_DEMO_PASSWORD || "holotech-demo";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("hex");
}

interface SessionPayload {
  managerId: string;
  email: string;
  name: string;
  role: "admin" | "manager";
  exp: number;
}

function encodeSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const base = Buffer.from(json).toString("base64url");
  return `${base}.${sign(base)}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [base, sig] = token.split(".");
  if (!base || !sig) return null;
  if (sign(base) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface AdminSession {
  managerId: string;
  email: string;
  name: string;
  role: "admin" | "manager";
}

/** Verifies email/password against the database `managers` table (or the
 *  single demo account when the database isn't configured yet) and, on
 *  success, sets the signed session cookie. Returns null on failure —
 *  including on a database error, so a DB hiccup never leaks past this
 *  function as an unhandled exception on the login form. */
export async function signIn(email: string, password: string): Promise<AdminSession | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!IS_DB_CONFIGURED) {
    if (normalizedEmail !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD) return null;
    const session: AdminSession = { managerId: "demo-admin", email: DEMO_EMAIL, name: "Demo Admin", role: "admin" };
    setSessionCookie(session);
    return session;
  }

  const sql = getDb();
  if (!sql) return null;

  let manager: ManagerRow | undefined;
  try {
    [manager] = await sql<ManagerRow[]>`
      select * from managers where email = ${normalizedEmail} and is_active = true
    `;
  } catch (err) {
    console.error("[admin-auth] sign-in query failed", describeDbError(err), err);
    return null;
  }

  if (!manager) return null;
  if (!verifyPasswordHash(password, manager.password_hash)) return null;

  const session: AdminSession = {
    managerId: manager.id,
    email: manager.email,
    name: manager.name,
    role: manager.role ?? "admin",
  };
  setSessionCookie(session);
  return session;
}

function setSessionCookie(session: AdminSession) {
  const token = encodeSession({ ...session, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function signOut(): void {
  cookies().delete(SESSION_COOKIE);
}

/** Reads and validates the session cookie. Use in Server Components / Route
 *  Handlers / Server Actions to check who (if anyone) is logged in. */
export function getAdminSession(): AdminSession | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = decodeSession(token);
  if (!payload) return null;
  return { managerId: payload.managerId, email: payload.email, name: payload.name, role: payload.role ?? "admin" };
}

/** Throws-free guard for use at the top of admin pages/route handlers:
 *  returns the session or null, caller decides how to redirect/respond. */
export function requireAdminSession(): AdminSession | null {
  return getAdminSession();
}
