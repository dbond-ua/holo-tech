-- HoloTech — combined migrations (0001-0010), regenerated 2026-09-18.
-- Convenience copy only — the numbered files in this directory are the source
-- of truth; apply them individually in order (see README). This file exists
-- so the whole schema can be pasted/piped in one shot when that's easier.

-- =============================================================================
-- 0001_init.sql
-- =============================================================================
-- HoloTech — self-hosted PostgreSQL schema — migration 0001 (base schema)
--
-- Part of migrations/ — apply in filename order (0001, 0002, ...), e.g.:
--   for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
-- This file is the original schema; later files layer on top of it. See the
-- README's "Налаштування PostgreSQL на VPS" section for the full sequence.
--
-- Run this once against a fresh database. Safe to re-run: every statement is
-- guarded with IF NOT EXISTS / CREATE OR REPLACE so re-applying it will not
-- duplicate objects.
--
-- This schema has exactly ONE database-connecting identity in production: a
-- single dedicated, low-privilege role used only by the backend (see
-- scripts/create-db-role.sql and migrations/0008_db_roles_and_grants.sql) —
-- there is no browser-reachable database role at all, unlike a
-- Supabase-style anon/service-role split. Access control is therefore
-- GRANT-based (who can connect to this database in the first place) plus
-- application-layer checks (published/unpublished filtering, admin-session
-- gating) — this file does not enable Row Level Security anywhere.
--
-- Design notes:
--  - Every user-facing text field is duplicated as `_uk` / `_en` columns (no i18n
--    JSON blobs) so the admin panel can show two plain inputs per field and the
--    storefront can select the right column directly in the query.
--  - Category-specific technical specs (power, capacity, voltage, etc.) live as
--    typed columns on `products` — shared across both locales — plus a flexible
--    `extra_specs jsonb` column for anything category-specific that doesn't
--    warrant its own column (per spec section 11/12: don't duplicate content
--    per language, keep specs data-driven).
--  - `orders` is a lead, not a full e-commerce order: contact info + delivery
--    preference + a snapshot of the cart at submission time (`order_items`),
--    plus UTM attribution and a status workflow driven by the Telegram bot.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- "stations" | "inverters" | "batteries" | "solar-panels" | "kits" | "accessories"
  title_uk text not null,
  title_en text not null,
  short_title_uk text not null,
  short_title_en text not null,
  description_uk text not null default '',
  description_en text not null default '',
  emoji text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid not null references categories(id) on delete restrict,
  brand_id uuid references brands(id) on delete set null,

  name_uk text not null,
  name_en text not null,
  tagline_uk text not null default '',
  tagline_en text not null default '',
  description_uk text not null default '',
  description_en text not null default '',
  whats_included_uk text[] not null default '{}',
  whats_included_en text[] not null default '{}',
  features_uk text[] not null default '{}',
  features_en text[] not null default '{}',

  -- SEO overrides (fall back to name/description when blank)
  seo_title_uk text,
  seo_title_en text,
  seo_description_uk text,
  seo_description_en text,

  price numeric(12,2) not null,
  old_price numeric(12,2),
  currency text not null default 'UAH',

  in_stock boolean not null default true,
  stock_count int, -- null = stock not tracked for this product (unlimited, governed only by in_stock)
  stock_reserved int not null default 0, -- units held by orders that are submitted but not yet confirmed
  low_stock_threshold int, -- null = use settings.low_stock_threshold_default

  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  is_demo boolean not null default false,
  expandable boolean not null default false,
  high_voltage boolean not null default false,

  -- shared typed technical specs (single source of truth, rendered per-locale
  -- by the storefront via dictionary labels — see src/lib/specs.ts)
  power_w int,
  capacity_wh int,
  outlets int,
  charge_time_h numeric(5,2),
  battery_type text,
  fast_charge boolean,
  is_lifepo4 boolean,
  has_ups boolean,
  solar_charging boolean,
  bluetooth boolean,
  wifi boolean,
  weight_kg numeric(6,2),
  phase text check (phase in ('single', 'three')),
  mppt int,
  inverter_type text check (inverter_type in ('hybrid', 'grid', 'off-grid')),
  voltage_v numeric(6,2),
  capacity_ah numeric(8,2),
  max_current_a numeric(8,2),
  cycles int,

  -- category-specific overflow specs that don't warrant a dedicated column,
  -- e.g. { "ip_rating": "IP65" } — keys are dictionary lookup keys, values are
  -- plain data (numbers/booleans/strings), never pre-translated text.
  extra_specs jsonb not null default '{}'::jsonb,

  images text[] not null default '{}', -- app-served URLs (/api/storage/products/<file>), ordered
  gallery_frame_count int not null default 1, -- used while `images` is empty (demo placeholder art)

  rating numeric(2,1) not null default 0,
  reviews_count int not null default 0,

  show_on_homepage boolean not null default false,
  homepage_sort_order int not null default 0,
  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_brand on products(brand_id);
create index if not exists idx_products_published on products(is_published);
create index if not exists idx_products_homepage on products(show_on_homepage, homepage_sort_order);

-- Re-running this file against a database created before stock tracking
-- existed: `create table if not exists` above is a no-op on an existing
-- table, so the new columns need their own idempotent ALTERs too.
alter table products add column if not exists stock_reserved int not null default 0;
alter table products add column if not exists low_stock_threshold int;

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on product_reviews(product_id);

create table if not exists kits (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_uk text not null,
  name_en text not null,
  tier text not null check (tier in ('basic', 'comfort', 'max')),
  inverter_kw numeric(6,2) not null,
  battery_kwh numeric(6,2) not null,
  price numeric(12,2) not null,
  old_price numeric(12,2),
  runtime_hours_uk text not null default '',
  runtime_hours_en text not null default '',
  suitable_for_uk text[] not null default '{}',
  suitable_for_en text[] not null default '{}',
  description_uk text not null default '',
  description_en text not null default '',
  whats_included_uk text[] not null default '{}',
  whats_included_en text[] not null default '{}',
  specs jsonb not null default '{"uk": [], "en": []}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  city text,
  created_at timestamptz not null default now(),
  unique (phone)
);

create table if not exists managers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null, -- bcrypt/scrypt hash, never plaintext
  telegram_user_id bigint, -- so inline-button callbacks can attribute an action to this manager
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders (lead capture, not full e-commerce checkout)
-- ---------------------------------------------------------------------------

do $$ begin
  create type order_status as enum (
    'new',            -- just submitted, nobody has actioned it yet
    'called',         -- manager marked "Подзвонив" / called the customer
    'contacted',      -- manager marked "Зв'язався" / reached the customer
    'postponed',      -- "Передзвонити пізніше" / call back later, see postponed_until
    'confirmed',      -- order confirmed with the customer
    'cancelled'       -- order cancelled
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_method as enum ('np_warehouse', 'np_poshtomat', 'courier');
exception when duplicate_object then null; end $$;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- human-friendly, e.g. TB-10023

  customer_id uuid references customers(id) on delete set null,
  name text not null,
  phone text not null,
  city text,

  delivery_method delivery_method not null default 'np_warehouse',
  np_city_ref text,       -- Nova Poshta Ref for the selected city
  np_city_name text,
  np_warehouse_ref text,  -- Nova Poshta Ref for the selected branch/locker
  np_warehouse_name text,
  courier_address text,

  comment text,

  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'UAH',

  status order_status not null default 'new',
  postponed_until timestamptz, -- set when status = 'postponed'

  -- attribution — captured on the client at page-load and re-sent with the
  -- order so we know which campaign a lead came from (analytics use is a
  -- later stage; for now we only store it correctly)
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_path text, -- first page of the session, for context

  -- reminder bookkeeping (stage 6)
  reminder_count int not null default 0,
  last_reminded_at timestamptz,
  next_reminder_at timestamptz,

  -- Telegram message bookkeeping so we can edit the notification in place
  telegram_chat_id text,
  telegram_message_id bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_next_reminder on orders(next_reminder_at) where status = 'new';

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  kit_id uuid references kits(id) on delete set null,
  name_uk text not null, -- snapshot at order time (product may change/be deleted later)
  name_en text not null,
  price numeric(12,2) not null,
  qty int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  manager_id uuid references managers(id) on delete set null,
  manager_name text, -- snapshot, survives manager deletion
  note text,
  source text not null default 'admin' check (source in ('admin', 'telegram', 'system')),
  created_at timestamptz not null default now()
);

create index if not exists idx_status_history_order on order_status_history(order_id);

-- ---------------------------------------------------------------------------
-- Stock adjustments — an append-only log of every change to a product's
-- stock_count / stock_reserved, whatever caused it. Populated exclusively
-- through the adjust_stock() function below so every change (order
-- reservation, order confirmation, order cancellation, or a manual admin
-- edit) leaves exactly one row with a resulting-balance snapshot, which is
-- what the admin product page renders as the stock history timeline.
-- ---------------------------------------------------------------------------

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  stock_delta int not null default 0,     -- change applied to stock_count (physical on-hand)
  reserved_delta int not null default 0,  -- change applied to stock_reserved
  reason text not null check (reason in (
    'order_reserved',    -- order submitted — units held, not yet deducted
    'order_confirmed',   -- order confirmed — reservation converted to a real deduction
    'order_cancelled',   -- order cancelled before confirmation — reservation released
    'order_restocked',   -- a *confirmed* order was later cancelled — units returned to stock
    'manual'              -- admin changed the stock count directly
  )),
  order_id uuid references orders(id) on delete set null,
  manager_id uuid references managers(id) on delete set null,
  manager_name text,
  note text,
  resulting_stock_count int,
  resulting_stock_reserved int,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_adjustments_product on stock_adjustments(product_id, created_at desc);

-- Single atomic entry point for every stock change — always used instead of
-- a read-then-write from the application, so concurrent order submissions
-- can't race each other into a negative or over-reserved balance. Both
-- deltas are clamped at 0 server-side (greatest(0, ...)), so a caller can
-- always pass the "ideal" delta without pre-checking availability itself.
create or replace function adjust_stock(
  p_product_id uuid,
  p_stock_delta int,
  p_reserved_delta int,
  p_reason text,
  p_order_id uuid default null,
  p_manager_id uuid default null,
  p_manager_name text default null,
  p_note text default null
) returns table(stock_count int, stock_reserved int) as $$
declare
  v_stock int;
  v_reserved int;
begin
  update products
  set
    stock_count = greatest(0, coalesce(products.stock_count, 0) + p_stock_delta),
    stock_reserved = greatest(0, products.stock_reserved + p_reserved_delta)
  where id = p_product_id
  returning products.stock_count, products.stock_reserved into v_stock, v_reserved;

  if not found then
    return;
  end if;

  insert into stock_adjustments (
    product_id, stock_delta, reserved_delta, reason, order_id,
    manager_id, manager_name, note, resulting_stock_count, resulting_stock_reserved
  ) values (
    p_product_id, p_stock_delta, p_reserved_delta, p_reason, p_order_id,
    p_manager_id, p_manager_name, p_note, v_stock, v_reserved
  );

  stock_count := v_stock;
  stock_reserved := v_reserved;
  return next;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Settings (single-row key/value store for things configured in the admin UI
-- rather than env vars — e.g. reminder intervals once they become tunable)
-- ---------------------------------------------------------------------------

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('reminder_intervals_minutes', '[15, 60, 240]'::jsonb),
  ('low_stock_threshold_default', '10'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_kits_updated_at on kits;
create trigger trg_kits_updated_at before update on kits
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Access control — intentionally NOT Row Level Security.
--
-- RLS (and the public/anon vs service_role policy split it implies) solved a
-- problem specific to Supabase's architecture: a Postgres role reachable
-- directly from the browser via PostgREST. That role does not exist in this
-- project's architecture — the browser never connects to Postgres, ever
-- (see the "no direct frontend -> PostgreSQL connection" constraint in the
-- README). Every single query, from the storefront, the admin panel, and
-- the Telegram webhook alike, goes through this app's own backend using ONE
-- dedicated, low-privilege database role.
--
-- Access control here is therefore GRANT-based instead: that one role gets
-- exactly the table/function privileges it needs (see
-- migrations/0008_db_roles_and_grants.sql and scripts/create-db-role.sql),
-- and nothing else can open a connection to this database at all (enforced
-- by Postgres listening on localhost/private network only and pg_hba.conf —
-- see the README). "Published vs unpublished" filtering
-- (products.is_published, kits.is_published) and admin-session
-- authorization both stay enforced in the application layer, exactly as
-- they already were before this rewrite.

-- =============================================================================
-- 0002_admin_roles.sql
-- =============================================================================
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

-- =============================================================================
-- 0003_customer_delivery_prefs.sql
-- =============================================================================
-- Migration 0003 — remember a customer's last-used delivery details and
-- language, so a repeat customer's order (matched by phone, see
-- src/lib/orders.ts upsert) carries their most recent city/branch/language
-- forward instead of just name/phone/city. Nova Poshta Refs live on `orders`
-- already (per-order snapshot); these columns on `customers` are the
-- "what did they pick last time" convenience copy.

alter table customers add column if not exists city_ref text;
alter table customers add column if not exists warehouse text;
alter table customers add column if not exists warehouse_ref text;
alter table customers add column if not exists language text check (language in ('uk', 'en'));

-- =============================================================================
-- 0004_order_numbering.sql
-- =============================================================================
-- Migration 0004 — human-friendly, date-sequential order numbers:
-- TB-YYYYMMDD-NNN (e.g. TB-20260915-001), replacing the old opaque
-- TB-<base36 timestamp><random> format. Generated by a single atomic SQL
-- function rather than in application code, so two orders submitted at the
-- exact same millisecond can never collide on the same number — the
-- `insert ... on conflict ... do update ... returning` below takes a
-- row-level lock on that day's counter row for the duration of the
-- statement, which is what makes it safe under concurrent requests.
--
-- Order numbers are opaque strings everywhere they're used in the app
-- (display + lookup key only, never parsed) — see src/lib/orders.ts,
-- confirmed by grep before writing this migration — so changing the format
-- is safe and needs no other code changes beyond how it's generated.

create table if not exists daily_order_seq (
  day date primary key,
  seq int not null default 0
);

create or replace function next_order_number() returns text as $$
declare
  v_day date := (now() at time zone 'Europe/Kyiv')::date;
  v_seq int;
begin
  insert into daily_order_seq (day, seq) values (v_day, 1)
  on conflict (day) do update set seq = daily_order_seq.seq + 1
  returning seq into v_seq;

  return 'TB-' || to_char(v_day, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
end;
$$ language plpgsql;

-- =============================================================================
-- 0005_extra_specs_array.sql
-- =============================================================================
-- Migration 0005 — repurpose the (previously unused) products.extra_specs
-- column as free-form, fully bilingual "additional characteristics" that an
-- admin can add per product without any code change.
--
-- It shipped in migration 0001 as `jsonb default '{}'` intended for
-- dictionary-keyed values (label resolved from the i18n dictionary, so a NEW
-- spec key would still have needed a code change to add its label) — but it
-- was never actually wired into the admin form or the storefront, so no
-- change here can break anything live. The new shape stores the label
-- itself, in both languages, alongside the value:
--
--   [{ "key": "ip-rating", "labelUk": "Клас захисту", "labelEn": "IP rating",
--      "valueUk": "IP65", "valueEn": "IP65" }, ...]
--
-- — a JSON ARRAY now, not an object, so the default changes accordingly.
-- `key` is just a stable react/list key generated client-side, not looked up
-- anywhere server-side.

alter table products alter column extra_specs set default '[]'::jsonb;

-- Any existing rows still holding the old empty-object default become an
-- empty array too (safe: the column has never been read or written by the
-- app until this feature, so there is no real data to lose here).
update products set extra_specs = '[]'::jsonb where extra_specs = '{}'::jsonb;

-- =============================================================================
-- 0006_demo_seed.sql
-- =============================================================================
-- Migration 0006 — demo data, in the database (not hardcoded in the
-- frontend), so a freshly-set-up database has something real to browse and
-- edit immediately: open /admin/products, change a price, see it change on
-- the public site.
--
-- This migration folds in categories + brands (the same set the project
-- shipped with from the start) and adds a handful of real demo products, per
-- the request that test products live in the DB rather than only in the
-- frontend's offline fallback catalog (src/lib/data.ts).
--
-- Fully idempotent (`on conflict ... do nothing`) — safe to re-run. Product
-- images are left empty (no real files exist yet in this VPS's local
-- PRODUCT_IMAGES_DIR to point at) — the storefront already renders generated
-- placeholder art for products with no `images`, exactly like the built-in
-- offline demo catalog these rows mirror (see
-- src/components/ui/ProductVisual.tsx). Two products intentionally carry an
-- `extra_specs` entry so the admin-editable "additional characteristics"
-- feature has something to show immediately.

-- Categories (slug is the FK the app matches against CategorySlug — must
-- stay in sync with src/lib/types.ts CategorySlug and the i18n dictionaries).
insert into categories (slug, title_uk, title_en, short_title_uk, short_title_en, description_uk, description_en, emoji, sort_order) values
  ('stations', 'Зарядні станції', 'Portable Power Stations', 'Станції', 'Stations', 'Портативні електростанції для дому, авто та подорожей', 'Portable power stations for home, car, and travel', '⚡', 1),
  ('inverters', 'Інвертори', 'Inverters', 'Інвертори', 'Inverters', 'Гібридні, мережеві та автономні інвертори', 'Hybrid, grid-tied, and off-grid inverters', '🔌', 2),
  ('batteries', 'LiFePO4 акумулятори', 'LiFePO4 Batteries', 'Акумулятори', 'Batteries', 'Акумуляторні батареї для систем резервного живлення', 'Battery packs for backup power systems', '🔋', 3),
  ('solar-panels', 'Сонячні панелі', 'Solar Panels', 'Сонячні панелі', 'Solar Panels', 'Сонячні панелі для заряджання станцій та систем', 'Solar panels for charging stations and systems', '☀️', 4),
  ('kits', 'Комплекти для дому', 'Home Kits', 'Комплекти', 'Kits', 'Готові системи інвертор + акумулятор під ключ', 'Turnkey inverter + battery systems', '🏠', 5),
  ('accessories', 'Аксесуари', 'Accessories', 'Аксесуари', 'Accessories', 'Кабелі, адаптери та аксесуари для станцій і систем', 'Cables, adapters, and accessories', '🧰', 6)
on conflict (slug) do nothing;

-- Brands — the full launch list.
insert into brands (name, sort_order) values
  ('EcoFlow', 1), ('OUKITEL', 2), ('Bluetti', 3), ('Anker SOLIX', 4),
  ('Jackery', 5), ('Zendure', 6), ('Deye', 7), ('Growatt', 8),
  ('Victron Energy', 9), ('Pylontech', 10), ('Dyness', 11)
on conflict (name) do nothing;

-- Demo products — one per major category, enough to exercise every admin
-- action (price/old_price/stock/publish/hide/specs) and every storefront
-- surface (catalog grid, product detail, homepage) right away.
insert into products (
  slug, category_id, brand_id, name_uk, name_en, tagline_uk, tagline_en,
  description_uk, description_en, price, old_price, in_stock, stock_count,
  is_new, is_bestseller, is_demo, show_on_homepage, homepage_sort_order,
  power_w, capacity_wh, outlets, battery_type, is_lifepo4, weight_kg,
  extra_specs
)
select
  v.slug, c.id, b.id, v.name_uk, v.name_en, v.tagline_uk, v.tagline_en,
  v.description_uk, v.description_en, v.price, v.old_price, true, v.stock_count,
  v.is_new, v.is_bestseller, true, v.show_on_homepage, v.homepage_sort_order,
  v.power_w, v.capacity_wh, v.outlets, v.battery_type, v.is_lifepo4, v.weight_kg,
  v.extra_specs
from (values
  (
    'demo-ecoflow-river-3', 'stations', 'EcoFlow',
    'EcoFlow RIVER 3', 'EcoFlow RIVER 3',
    'Компактна станція для щоденного використання', 'Compact station for everyday use',
    'Легка портативна зарядна станція з швидким зарядженням — оптимальна для дому, роботи та подорожей.',
    'A light, portable power station with fast charging — a great fit for home, work and travel.',
    12999::numeric, 14999::numeric, true, 15,
    true, true, true, 1,
    300, 245, 3, 'LiFePO4', true, 4.6::numeric,
    '[{"key":"noise","labelUk":"Рівень шуму","labelEn":"Noise level","valueUk":"< 30 дБ","valueEn":"< 30 dB"}]'::jsonb
  ),
  (
    'demo-jackery-explorer-1000', 'stations', 'Jackery',
    'Jackery Explorer 1000 v2', 'Jackery Explorer 1000 v2',
    'Потужна станція для дому та відпочинку на природі', 'A powerful station for home and outdoor use',
    'Потужна зарядна станція для резервного живлення дому або тривалих подорожей.',
    'A high-capacity power station for backup home power or extended trips.',
    24999::numeric, null, true, 8,
    false, true, true, 2,
    1000, 1070, 4, 'LiFePO4', true, 11.5::numeric,
    '[]'::jsonb
  ),
  (
    'demo-anker-solix-c1000', 'inverters', 'Anker SOLIX',
    'Anker SOLIX Home Inverter 3kW', 'Anker SOLIX Home Inverter 3kW',
    'Гібридний інвертор для домашньої системи резервного живлення', 'Hybrid inverter for a home backup power system',
    'Гібридний інвертор з підтримкою сонячних панелей та акумуляторів для автономного живлення будинку.',
    'A hybrid inverter with solar and battery support for autonomous home power.',
    18999::numeric, 21999::numeric, true, 5,
    true, false, true, 0,
    3000, null, null, null, null, 6.2::numeric,
    '[]'::jsonb
  ),
  (
    'demo-pylontech-us5000', 'batteries', 'Pylontech',
    'Pylontech US5000', 'Pylontech US5000',
    'Модульний LiFePO4 акумулятор для систем резервного живлення', 'Modular LiFePO4 battery for backup power systems',
    'Надійний модульний акумулятор, який легко масштабувати додаванням модулів.',
    'A reliable modular battery that scales easily by adding more modules.',
    32999::numeric, null, true, 3,
    false, true, true, 3,
    null, 4800, null, 'LiFePO4', true, 47::numeric,
    '[{"key":"cycles-warranty","labelUk":"Гарантія циклів","labelEn":"Cycle warranty","valueUk":"6000+ циклів","valueEn":"6000+ cycles"}]'::jsonb
  ),
  (
    'demo-solar-panel-400w', 'solar-panels', 'EcoFlow',
    'EcoFlow 400W Portable Solar Panel', 'EcoFlow 400W Portable Solar Panel',
    'Портативна сонячна панель для швидкого заряджання станцій', 'Portable solar panel for fast station charging',
    'Складана сонячна панель високої ефективності для заряджання станцій у польових умовах.',
    'A high-efficiency foldable solar panel for charging stations off-grid.',
    15999::numeric, null, true, 0,
    false, false, true, 0,
    400, null, null, null, null, 9.5::numeric,
    '[]'::jsonb
  )
) as v(
  slug, category_slug, brand_name, name_uk, name_en, tagline_uk, tagline_en,
  description_uk, description_en, price, old_price, in_stock, stock_count,
  is_new, is_bestseller, show_on_homepage, homepage_sort_order,
  power_w, capacity_wh, outlets, battery_type, is_lifepo4, weight_kg, extra_specs
)
join categories c on c.slug = v.category_slug
join brands b on b.name = v.brand_name
on conflict (slug) do nothing;

-- =============================================================================
-- 0007_order_language.sql
-- =============================================================================
-- Migration 0007 — remember which storefront locale (uk/en) a customer
-- ordered from, on the order itself — one of the minimum columns asked for
-- on `orders` (alongside customer_id/status/total/comment/utm_*), separate
-- from the same-named column added to `customers` in migration 0003 (that
-- one is "their usual language", this one is "what this specific order was
-- placed in" — a returning customer could switch locale between orders).
--
-- Not currently read anywhere (Telegram messages to managers are always in
-- Ukrainian by design — see src/lib/telegram.ts — and the customer-facing
-- order confirmation page already follows the /uk or /en URL segment on its
-- own). Stored now, without a reader, only so it's captured accurately from
-- day one rather than backfilled later from a UTM/landing-path guess; safe
-- to build a feature on top of it later (e.g. an emailed confirmation in the
-- customer's language) without another migration.

alter table orders add column if not exists language text check (language in ('uk', 'en'));

-- =============================================================================
-- 0008_db_roles_and_grants.sql
-- =============================================================================
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

-- =============================================================================
-- 0009_extra_indexes.sql
-- =============================================================================
-- Migration 0009 — indexes on foreign-key columns the app doesn't query
-- against yet, but plausibly will as the admin panel grows (a customer's
-- order history, a product's order history). The columns already queried
-- today (orders.status, orders.created_at, order_items.order_id,
-- order_status_history.order_id, stock_adjustments.product_id, every
-- unique constraint) were already indexed in 0001_init.sql — this migration
-- only fills in the remaining FK columns, cheap to maintain at this table
-- size and standard practice for any FK that might be filtered/joined on.

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_order_items_product on order_items(product_id);
create index if not exists idx_order_items_kit on order_items(kit_id);

-- =============================================================================
-- 0010_nova_poshta_directory.sql
-- =============================================================================
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

