/**
 * Hand-written types mirroring migrations/ (see 0001_init.sql plus the later
 * numbered migrations). If you change the schema, update this file to
 * match — there is no code-generation step for a self-hosted database, so
 * this file is the single source of truth for row shapes on the TS side.
 */

export type OrderStatus = "new" | "called" | "contacted" | "postponed" | "confirmed" | "cancelled";
export type DeliveryMethod = "np_warehouse" | "np_poshtomat" | "courier";

export interface CategoryRow {
  id: string;
  slug: string;
  title_uk: string;
  title_en: string;
  short_title_uk: string;
  short_title_en: string;
  description_uk: string;
  description_en: string;
  emoji: string;
  sort_order: number;
  created_at: string;
}

export interface BrandRow {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  category_id: string;
  brand_id: string | null;
  name_uk: string;
  name_en: string;
  tagline_uk: string;
  tagline_en: string;
  description_uk: string;
  description_en: string;
  whats_included_uk: string[];
  whats_included_en: string[];
  features_uk: string[];
  features_en: string[];
  seo_title_uk: string | null;
  seo_title_en: string | null;
  seo_description_uk: string | null;
  seo_description_en: string | null;
  price: number;
  old_price: number | null;
  currency: string;
  in_stock: boolean;
  stock_count: number | null;
  stock_reserved: number;
  low_stock_threshold: number | null;
  is_new: boolean;
  is_bestseller: boolean;
  is_demo: boolean;
  expandable: boolean;
  high_voltage: boolean;
  power_w: number | null;
  capacity_wh: number | null;
  outlets: number | null;
  charge_time_h: number | null;
  battery_type: string | null;
  fast_charge: boolean | null;
  is_lifepo4: boolean | null;
  has_ups: boolean | null;
  solar_charging: boolean | null;
  bluetooth: boolean | null;
  wifi: boolean | null;
  weight_kg: number | null;
  phase: "single" | "three" | null;
  mppt: number | null;
  inverter_type: "hybrid" | "grid" | "off-grid" | null;
  voltage_v: number | null;
  capacity_ah: number | null;
  max_current_a: number | null;
  cycles: number | null;
  /** Admin-defined custom characteristics — see migrations/0005_extra_specs_array.sql.
   *  Shape: [{ key, labelUk, labelEn, valueUk, valueEn }, ...]. Typed loosely
   *  here (it's jsonb) and validated/narrowed where it's read — see
   *  mapProductRow() in src/lib/catalog.ts. Note: postgres.js returns jsonb
   *  columns already parsed into a JS value, not a JSON string. */
  extra_specs: unknown;
  images: string[];
  gallery_frame_count: number;
  rating: number;
  reviews_count: number;
  show_on_homepage: boolean;
  homepage_sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductReviewRow {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  body: string;
  verified: boolean;
  created_at: string;
}

export interface KitRow {
  id: string;
  slug: string;
  name_uk: string;
  name_en: string;
  tier: "basic" | "comfort" | "max";
  inverter_kw: number;
  battery_kwh: number;
  price: number;
  old_price: number | null;
  runtime_hours_uk: string;
  runtime_hours_en: string;
  suitable_for_uk: string[];
  suitable_for_en: string[];
  description_uk: string;
  description_en: string;
  whats_included_uk: string[];
  whats_included_en: string[];
  specs: { uk: { label: string; value: string }[]; en: { label: string; value: string }[] };
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  /** Delivery prefs remembered from this customer's most recent order —
   *  added in migrations/0003_customer_delivery_prefs.sql. */
  city_ref: string | null;
  warehouse: string | null;
  warehouse_ref: string | null;
  language: "uk" | "en" | null;
  created_at: string;
}

export interface ManagerRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  telegram_user_id: number | null;
  is_active: boolean;
  /** 'admin' (full access) | 'manager' (orders only, no product/catalog edits).
   *  Added in migrations/0002_admin_roles.sql; defaults to 'admin' for every
   *  existing/new row — this is a single small team's internal panel. */
  role: "admin" | "manager";
  created_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  name: string;
  phone: string;
  city: string | null;
  delivery_method: DeliveryMethod;
  np_city_ref: string | null;
  np_city_name: string | null;
  np_warehouse_ref: string | null;
  np_warehouse_name: string | null;
  courier_address: string | null;
  comment: string | null;
  /** Storefront locale this order was placed from — see
   *  migrations/0007_order_language.sql. */
  language: "uk" | "en" | null;
  subtotal: number;
  total: number;
  currency: string;
  status: OrderStatus;
  postponed_until: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_path: string | null;
  reminder_count: number;
  last_reminded_at: string | null;
  next_reminder_at: string | null;
  telegram_chat_id: string | null;
  telegram_message_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  kit_id: string | null;
  name_uk: string;
  name_en: string;
  price: number;
  qty: number;
  created_at: string;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  manager_id: string | null;
  manager_name: string | null;
  note: string | null;
  source: "admin" | "telegram" | "system";
  created_at: string;
}

export interface SettingsRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export type StockAdjustmentReason =
  | "order_reserved"
  | "order_confirmed"
  | "order_cancelled"
  | "order_restocked"
  | "manual";

export interface StockAdjustmentRow {
  id: string;
  product_id: string;
  stock_delta: number;
  reserved_delta: number;
  reason: StockAdjustmentReason;
  order_id: string | null;
  manager_id: string | null;
  manager_name: string | null;
  note: string | null;
  resulting_stock_count: number | null;
  resulting_stock_reserved: number | null;
  created_at: string;
}

/** Return shape of the `adjust_stock` SQL function (see migrations/0001_init.sql). */
export interface AdjustStockResult {
  stock_count: number;
  stock_reserved: number;
}

// ---------------------------------------------------------------------------
// Nova Poshta local directory — see migrations/0010_nova_poshta_directory.sql
// and src/lib/novaposhta-import.ts. Filled entirely by the daily/manual
// importer; never written to directly by any request-handling code path.
// ---------------------------------------------------------------------------

export type NovaWarehouseType = "warehouse" | "poshtomat" | "other";

export interface NovaWarehouseTypeRow {
  ref: string;
  description_uk: string;
  updated_at: string;
}

export interface NovaCityRow {
  id: string;
  ref: string;
  name_uk: string;
  name_en: string | null;
  area: string;
  settlement_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovaWarehouseRow {
  id: string;
  ref: string;
  city_ref: string;
  name: string;
  short_address: string;
  number: string;
  warehouse_type_ref: string;
  category: string;
  type: NovaWarehouseType;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
