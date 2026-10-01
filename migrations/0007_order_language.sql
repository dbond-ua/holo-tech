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
