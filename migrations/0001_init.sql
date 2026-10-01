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
