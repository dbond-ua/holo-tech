-- Migration 0011 — supplier price-list import (scripts/import-mplus.mjs).
--
-- Adds a stable link between a catalog product and the supplier's own
-- article number, so re-running the import with a fresh price list updates
-- the SAME product (price, availability) instead of creating a duplicate.
--
--   supplier            — short supplier code, e.g. 'mplus'; null for products
--                         created by hand in the admin panel (never touched by
--                         any import).
--   supplier_sku        — the supplier's article number ("Артикул").
--   supplier_price_usd  — the supplier's own price, kept for reference so the
--                         markup applied to `price` can always be audited.
--   supplier_synced_at  — when the last import run saw this product.
--
-- Safe to re-run: every statement is guarded with IF NOT EXISTS.

alter table products add column if not exists supplier text;
alter table products add column if not exists supplier_sku text;
alter table products add column if not exists supplier_price_usd numeric(12,2);
alter table products add column if not exists supplier_synced_at timestamptz;

create unique index if not exists idx_products_supplier_sku
  on products(supplier, supplier_sku)
  where supplier is not null;
