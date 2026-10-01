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
