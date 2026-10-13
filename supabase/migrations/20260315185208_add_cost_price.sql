-- Migration to add cost_price tracking for P&L Dashboard

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_cost_price numeric(10,2);
