-- Creates the HoloTech database and its single, low-privilege application
-- role. Run this ONCE, by hand, as the Postgres superuser — never as part
-- of an automated migration run, and never with this file committed
-- anywhere with a real password in it (see the placeholder below).
--
-- Usage (as the `postgres` Linux user on the VPS):
--   sudo -u postgres psql -f scripts/create-db-role.sql
--
-- Before running: replace CHANGE_ME_STRONG_PASSWORD below with a real,
-- randomly generated password (e.g. `openssl rand -base64 32`) — either
-- edit this file in place on the server just before running it and discard
-- the edit afterwards, or run the two CREATE statements interactively in
-- `psql` instead of from this file, whichever you're more comfortable with.
-- Either way, that password is also what goes into DATABASE_URL in your
-- .env — see .env.example — and it must never be committed to git.
--
-- After this script, apply the schema as the new role's OWNER, i.e. as
-- `postgres` (which is what the loop in the README's migrations step does)
-- — the role created here only gets its privileges from
-- migrations/0008_db_roles_and_grants.sql, run *after* 0001-0007/0009 have
-- already created the tables/functions it grants access to.

create database holotech;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'holotech_app') then
    create role holotech_app with login password 'CHANGE_ME_STRONG_PASSWORD';
  end if;
end
$$;

-- Least-privilege from the start: this role can connect to the holotech
-- database and nothing else (no CREATEDB, no CREATEROLE, not a superuser).
-- Table/function-level privileges are granted separately, in
-- migrations/0008_db_roles_and_grants.sql, after the schema exists.
grant connect on database holotech to holotech_app;
alter role holotech_app set search_path = public;

-- Optional but recommended hardening: cap how long a single statement or an
-- idle-in-transaction session can run for this role, so a stuck request
-- can't hold locks or a connection forever.
alter role holotech_app set statement_timeout = '30s';
alter role holotech_app set idle_in_transaction_session_timeout = '60s';
