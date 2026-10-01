/**
 * Central place that reads integration env vars and exposes simple booleans
 * for "is this integration configured". Every integration in the app must
 * degrade gracefully (demo data / no-op) when its flag is false, per the
 * project's "works with zero configuration, upgrades itself once real
 * credentials are added" requirement.
 */

// ---------------------------------------------------------------------------
// Database — self-hosted PostgreSQL (no managed/cloud provider). The app
// connects with ONE dedicated, low-privilege role (see
// scripts/create-db-role.sql) over a connection that never leaves the VPS:
// Postgres is configured to listen on localhost/private network only (see
// README "Настройка PostgreSQL на VPS"), so DATABASE_URL normally points at
// 127.0.0.1 — the network boundary that keeps the DB unreachable from the
// internet is Postgres's own listen_addresses/pg_hba.conf/firewall
// configuration, not anything in this file.
// ---------------------------------------------------------------------------
export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const IS_DB_CONFIGURED = Boolean(DATABASE_URL);

// Local filesystem directory product photos are written to/read from — see
// src/lib/storage/local.ts. Resolved relative to the process working
// directory when not absolute. Keep this OUTSIDE the Next.js `public/`
// folder and outside git (see .gitignore) — files are served through
// src/app/api/storage/products/[filename]/route.ts, never directly by the
// web server, so there is no reason for it to live under `public/`.
export const PRODUCT_IMAGES_DIR = process.env.PRODUCT_IMAGES_DIR ?? "./storage/products";

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
export const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

export const IS_TELEGRAM_CONFIGURED = Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);

export const NOVA_POSHTA_API_KEY = process.env.NOVA_POSHTA_API_KEY ?? "";
export const IS_NOVA_POSHTA_CONFIGURED = Boolean(NOVA_POSHTA_API_KEY);

export const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-only-insecure-secret-change-me";
export const CRON_SECRET = process.env.CRON_SECRET ?? "";

// One-time secret gating POST /api/admin/bootstrap (creates the first
// manager row without hand-writing SQL). Left unset by default — the route
// refuses to do anything unless this is explicitly set, so an unconfigured
// deployment never exposes an open "create an admin" endpoint.
export const ADMIN_BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET ?? "";

export const SITE_URL_ENV = process.env.NEXT_PUBLIC_SITE_URL ?? "https://holotech.store";
