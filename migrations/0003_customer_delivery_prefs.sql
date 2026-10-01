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
