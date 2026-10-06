-- Migration 0012 — electronics range from the supplier import.
--
-- Adds the eight electronics categories the storefront serves through the
-- generic src/app/(shop)/[locale]/[category] routes (their slugs must match
-- electronicsCategorySlugs in src/lib/data.ts), and two free-text grouping
-- columns the supplier provides for every product:
--
--   subcategory  — section inside a category, e.g. 'Техніка для кухні'
--   product_type — product type, e.g. 'Чайники'
--
-- Both are shown as catalog filters ("Розділ" / "Тип"). Null for products
-- that don't come from a supplier import.
--
--   supplier_price_flagged — the importer judged the supplier price
--   implausibly low (a fraction of the median for the same product type;
--   the price list has such errors, e.g. a camera at $46). New flagged
--   products are imported unpublished; see scripts/import-mplus.mjs.
--
-- Safe to re-run: IF NOT EXISTS / ON CONFLICT DO NOTHING throughout.

alter table products add column if not exists subcategory text;
alter table products add column if not exists product_type text;
alter table products add column if not exists supplier_price_flagged boolean not null default false;

insert into categories (slug, title_uk, title_en, short_title_uk, short_title_en, description_uk, description_en, emoji, sort_order) values
  ('audio-video', 'Фото, відео, аудіо', 'Photo, video & audio', 'Аудіо та фото', 'Audio & photo', 'Навушники, портативна акустика, фото- та екшн-камери', 'Headphones, portable speakers, photo and action cameras', '🎧', 10),
  ('home-appliances', 'Побутова техніка', 'Home appliances', 'Побутова техніка', 'Appliances', 'Велика й дрібна техніка, техніка для кухні, краси та клімату', 'Large and small appliances for the kitchen, beauty and climate', '🧺', 11),
  ('computers', 'Ноутбуки та комп''ютери', 'Laptops & computers', 'Комп''ютери', 'Computers', 'Ноутбуки, моноблоки, периферія, накопичувачі та оргтехніка', 'Laptops, all-in-ones, peripherals, storage and office equipment', '💻', 12),
  ('smart-gadgets', 'Смарт-гаджети', 'Smart gadgets', 'Гаджети', 'Gadgets', 'Роутери, гаджети для дому, кухні та авто, квадрокоптери, Starlink', 'Routers, home, kitchen and car gadgets, drones, Starlink', '💡', 13),
  ('watches', 'Годинники та трекери', 'Watches & trackers', 'Годинники', 'Watches', 'Смарт-годинники, фітнес-трекери, смарт-кільця та ремінці', 'Smartwatches, fitness trackers, smart rings and straps', '⌚', 14),
  ('apple', 'Техніка Apple', 'Apple', 'Apple', 'Apple', 'MacBook, iMac, Apple Watch та гаджети Apple', 'MacBook, iMac, Apple Watch and Apple gadgets', '🍏', 15),
  ('tv-monitors', 'ТВ, монітори, проектори', 'TVs, monitors & projectors', 'ТВ і монітори', 'TVs & monitors', 'Телевізори, монітори, проектори та ТБ-приставки', 'TVs, monitors, projectors and set-top boxes', '📺', 16),
  ('gaming', 'Гральна зона', 'Gaming', 'Ігри', 'Gaming', 'Ігрові консолі, ігри, геймпади та VR', 'Consoles, games, controllers and VR', '🎮', 17)
on conflict (slug) do nothing;

create index if not exists idx_products_category_published on products(category_id, is_published);
