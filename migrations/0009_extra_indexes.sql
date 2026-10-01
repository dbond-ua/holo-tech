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
