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
