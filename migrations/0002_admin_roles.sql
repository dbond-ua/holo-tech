-- Migration 0002 — explicit admin role on managers.
--
-- `managers` already IS the app's "admins/users" table (id/email/created_at,
-- referenced by manager_id everywhere: orders, stock_adjustments,
-- order_status_history). Adding a separate `admins`/`users` table alongside
-- it would just duplicate that identity — this migration instead adds the
-- one thing that table didn't have yet: an explicit `role` column, so "this
-- account is an admin" is a real stored fact rather than an implication
-- ("a row exists in managers" = "is an admin").
--
-- All current/future managers default to 'admin' (this is a single small
-- team's internal panel, not a multi-tier org) — the check constraint still
-- leaves room for a lower-privilege 'manager' role later without a schema
-- change if the team ever wants order-only staff who can't touch products.

alter table managers add column if not exists role text not null default 'admin';

do $$ begin
  alter table managers add constraint managers_role_check check (role in ('admin', 'manager'));
exception when duplicate_object then null; end $$;
