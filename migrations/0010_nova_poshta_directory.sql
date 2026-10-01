-- Migration 0010 — local Nova Poshta directory (cities, warehouses,
-- warehouse types), imported by src/lib/novaposhta-import.ts and served to
-- the storefront entirely from this database. No NOVA_POSHTA_API_KEY is
-- involved anywhere in this migration or the importer that fills these
-- tables — see the comment at the top of novaposhta-import.ts for why:
-- Address.getCities / Address.getWarehouses / Address.getWarehouseTypes are
-- documented as not requiring an API key.
--
-- Architecture this table set supports:
--   Nova Poshta API -> daily importer -> these tables -> backend API ->
--   frontend dropdowns
-- The frontend and the checkout Route Handlers never call Nova Poshta
-- directly — only the importer does, and only on a schedule/manual trigger,
-- never per page view (see the "не завантажувати весь довідник при
-- кожному відкритті форми" requirement).

create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- nova_warehouse_types — small reference table (a handful of rows: Відділення,
-- Поштомат, Вантажне відділення, Магазин, ...), refreshed on every import run
-- from Address.getWarehouseTypes. This is what lets the importer resolve
-- "which TypeOfWarehouse Ref means postomat" DYNAMICALLY every run instead of
-- a hardcoded GUID that could be wrong or change — see resolveWarehouseType()
-- in novaposhta-import.ts. Kept as a real table (not just an in-memory map)
-- so the mapping is inspectable/debuggable directly in the database.
-- ---------------------------------------------------------------------------
create table if not exists nova_warehouse_types (
  ref text primary key,
  description_uk text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- nova_cities — one row per Nova Poshta settlement (Address.getCities).
-- Nova Poshta's API only ever returns Ukrainian (and Russian) descriptions —
-- there is no official English name, so name_en stays null; the storefront
-- falls back to name_uk on the /en locale (see src/lib/novaposhta.ts).
-- ---------------------------------------------------------------------------
create table if not exists nova_cities (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  name_uk text not null,
  name_en text,
  area text not null default '',        -- oblast, e.g. "Київська область"
  settlement_type text not null default '', -- "Місто" | "Село" | "Селище міського типу" | ...
  is_active boolean not null default true,  -- false = no longer returned by a fresh full sync
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nova_cities_active on nova_cities(is_active);
-- Trigram index: powers "contains" search on partial/typo'd Ukrainian city
-- names (ILIKE '%...%') fast even with tens of thousands of rows — a plain
-- btree can only accelerate prefix search.
create index if not exists idx_nova_cities_name_trgm on nova_cities using gin (name_uk gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- nova_warehouses — one row per branch/postomat (Address.getWarehouses).
-- city_ref is intentionally NOT a foreign key into nova_cities(ref): the
-- cities and warehouses are imported as two separate paginated sweeps, and a
-- hard FK would make the whole import fail if a warehouse ever references a
-- settlement that a given getCities page didn't (yet) return. It's still
-- indexed for fast lookups; nova_cities.ref uniqueness is what the app relies
-- on for joins, not a DB-level constraint between these two tables.
-- ---------------------------------------------------------------------------
create table if not exists nova_warehouses (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  city_ref text not null,
  name text not null,                    -- full description, e.g. "Відділення №1: вул. Хрещатик, 22"
  short_address text not null default '',
  number text not null default '',
  warehouse_type_ref text not null default '', -- raw TypeOfWarehouse Ref from the API, kept for traceability
  category text not null default '',     -- raw CategoryOfWarehouse from the API (secondary signal, not authoritative)
  type text not null default 'other' check (type in ('warehouse', 'poshtomat', 'other')), -- resolved via nova_warehouse_types, see novaposhta-import.ts
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nova_warehouses_city on nova_warehouses(city_ref, type) where is_active = true;
create index if not exists idx_nova_warehouses_active on nova_warehouses(is_active);

-- ---------------------------------------------------------------------------
-- Grants — belt-and-suspenders. migrations/0008_db_roles_and_grants.sql
-- already set ALTER DEFAULT PRIVILEGES for the public schema, which should
-- cover these brand-new tables automatically as long as this migration is
-- applied by the same role that applied 0001-0009 (the normal setup — see
-- README). This explicit grant is here only in case that role differs or
-- default privileges weren't set up for some other reason; it's a harmless
-- no-op otherwise. Uses the same role-existence guard as 0008 so this
-- migration doesn't fail outright on a database where holotech_app hasn't
-- been created yet (e.g. running migrations against a fresh dev database
-- before scripts/create-db-role.sql).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'holotech_app') then
    grant select, insert, update, delete on nova_cities, nova_warehouses, nova_warehouse_types to holotech_app;
  end if;
end
$$;
