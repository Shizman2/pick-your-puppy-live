-- Q4 Business Scorecard - Part 2 of the approved audit's V1
-- architecture (Part 1 was Analytics Job 1: visitor/session
-- attribution, already shipped).
--
-- ad_spend_entries: manual V1 ad spend logging (no Meta/Google API
-- integration), per the approved audit - one row per logged amount,
-- summed over a date range for Ad Spend / CPL / CAC / ROAS. Mirrors
-- the existing analytics tables' pattern: RLS enabled, no public
-- policies, service-role only (all reads/writes go through
-- lib/adSpend.ts + its admin server actions, never the browser
-- directly).
create table if not exists ad_spend_entries (
  id uuid primary key default gen_random_uuid(),
  spend_date date not null,
  amount_cents integer not null check (amount_cents >= 0),
  platform text not null check (platform in ('meta', 'google', 'tiktok', 'other')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_spend_entries_spend_date_idx on ad_spend_entries (spend_date);

alter table ad_spend_entries enable row level security;

-- Revenue/Profit goal targets, alongside the existing target_count
-- (puppies) on sales_goals (see supabase/028_sales_goal_name_and_end_date.sql
-- for name/end_date, added the same way). Both nullable - an admin can
-- set a puppy target without necessarily having set revenue/profit
-- targets yet; the dashboard simply omits that progress ring when null.
alter table sales_goals add column if not exists revenue_goal_cents integer;
alter table sales_goals add column if not exists profit_goal_cents integer;
