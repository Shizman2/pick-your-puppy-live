-- Job 2 Financial Correction - adds the two missing per-sale cost
-- fields the corrected, transaction-based Gross Profit formula needs
-- (lib/businessScorecard.ts), plus an optional campaign label on ad
-- spend entries. Migration 031 (landing-page attribution) is already
-- live in production and is untouched by this file.
--
-- delivery_cost_cents/other_cost_cents live on SALES, not puppies -
-- unlike puppies.cost_cents/bundle_cost_cents (acquisition economics,
-- intrinsic to the puppy itself), delivery/other direct costs vary by
-- the specific transaction (see sales.fulfillment_method, already
-- per-sale) and must not be conflated with puppy-level cost.
--
-- NOT NULL DEFAULT 0, same convention already used for
-- puppies.cost_cents/bundle_cost_cents - every existing sale
-- automatically backfills to 0 the moment this column is added (a
-- NOT NULL DEFAULT on an ALTER TABLE ADD COLUMN populates every
-- existing row with the default value), so no sale ever has a null
-- cost silently breaking the Gross Profit sum.
alter table sales add column if not exists delivery_cost_cents integer not null default 0;
alter table sales add column if not exists other_cost_cents integer not null default 0;

alter table sales drop constraint if exists sales_delivery_cost_cents_check;
alter table sales add constraint sales_delivery_cost_cents_check check (delivery_cost_cents >= 0);

alter table sales drop constraint if exists sales_other_cost_cents_check;
alter table sales add constraint sales_other_cost_cents_check check (other_cost_cents >= 0);

-- Optional campaign label on a manually-logged ad spend entry (see
-- supabase/030_ad_spend_and_revenue_profit_goals.sql for the table
-- itself). Nullable - most entries may not need one, same as the
-- existing "note" field.
alter table ad_spend_entries add column if not exists campaign_name text;
