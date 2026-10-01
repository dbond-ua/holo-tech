-- Migration 0008 — least-privilege grants for the app's database role.
--
-- Run this AFTER scripts/create-db-role.sql has already created the login
-- role itself (this migration only grants privileges to a role that must
-- already exist — it does not create one, since CREATE ROLE ... PASSWORD is
-- a one-time administrative action meant to be run once, by hand, as the
-- Postgres superuser, never repeated by an idempotent migration runner. See
-- the README's "Налаштування PostgreSQL на VPS" section for the exact
-- order: create the database and role first, then apply migrations 0001
-- through this one).
--
-- Replaces this project's former Supabase Row Level Security policies (see
-- the comment at the end of migrations/0001_init.sql) — the equivalent
-- boundary here is which Postgres role can even connect, and what that role
-- is allowed to do, not per-row policies. The app connects with exactly ONE
-- role for everything (storefront reads, admin writes, order creation,
-- Telegram-driven status changes) — there is no separate "public" role,
-- because nothing but this backend ever talks to Postgres directly.
--
-- Edit holotech_app below to match the role name you actually created in
-- scripts/create-db-role.sql if you chose a different one.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'holotech_app') then
    raise exception 'Role "holotech_app" does not exist yet — run scripts/create-db-role.sql first (or edit this migration to match the role name you used).';
  end if;
end
$$;

-- Let the role connect to this database and use the public schema at all.
-- (scripts/create-db-role.sql already grants CONNECT on the real database
-- name when you followed the README's setup order — this repeats it
-- dynamically, via current_database(), so this migration is also safe to
-- run standalone against whatever database you're connected to.)
do $$
begin
  execute format('grant connect on database %I to holotech_app', current_database());
end
$$;
grant usage on schema public to holotech_app;

-- Ordinary CRUD on every application table — no DDL rights (no CREATE/DROP/
-- ALTER TABLE), so a compromised app process can read/write rows but can't
-- restructure or drop the schema.
grant select, insert, update, delete on all tables in schema public to holotech_app;

-- uuid primary keys are generated with gen_random_uuid() (pgcrypto), so
-- there are no bigserial sequences to grant here today — this is included
-- for forward compatibility in case a future column ever needs one.
grant usage, select on all sequences in schema public to holotech_app;

-- Needed to call adjust_stock(), next_order_number(), and the updated_at
-- trigger function.
grant execute on all functions in schema public to holotech_app;

-- Cover tables/sequences/functions created by LATER migrations too, so a
-- fresh 0010_whatever.sql doesn't silently need its own grants migration —
-- this only affects objects created by the same role that runs the
-- migrations (typically the superuser/owner), which is the normal setup.
alter default privileges in schema public grant select, insert, update, delete on tables to holotech_app;
alter default privileges in schema public grant usage, select on sequences to holotech_app;
alter default privileges in schema public grant execute on functions to holotech_app;
