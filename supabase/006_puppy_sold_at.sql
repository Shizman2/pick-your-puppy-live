-- Run this once in the Supabase SQL Editor.
--
-- Adds a real "sold date" to puppies, so sales-performance metrics
-- (Sold This Week, Weekly Goal Progress) can be calculated from when a
-- puppy actually became sold, instead of guessing from payment
-- completion or general updated_at. Nullable - only set going forward
-- by app code (app/admin/puppies/actions.ts and app/admin/sales/actions.ts)
-- when a puppy's status transitions into/out of 'sold'.
--
-- No historical backfill here for existing sold puppies - see the
-- accompanying report for why, and what was done for the one row we
-- had explicit, confirmed information about.

alter table puppies add column if not exists sold_at timestamptz;
