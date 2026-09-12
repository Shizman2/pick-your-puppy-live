-- Affiliate Program - Phase 4: fulfillment + financial-completion
-- tracking on sales, affiliate attribution snapshot on sales, and the
-- canonical Puppy Finder -> Puppy conversion link.
--
-- sales/payments/puppies were never captured in a migration file before
-- this project (same situation contacts was in before migration 003).
-- Confirmed via a live read-only information_schema-equivalent check
-- (selecting real rows and inspecting their columns) immediately before
-- writing this file: sales has exactly
-- (id, puppy_id, contact_id, sale_price_cents, status, created_at,
-- updated_at) and payments has exactly
-- (id, sale_id, amount_cents, payment_method, payment_type, note,
-- paid_at, created_at, updated_at) - matching lib/saleTypes.ts exactly,
-- no hidden columns. sales.puppy_id stays NOT NULL throughout this file:
-- Puppy Finder options get promoted into a real puppies row at the
-- moment the admin confirms the deposit (see confirmDepositReceived in
-- app/admin/puppy-finder/actions.ts), so sales never references a
-- puppy_finder_option directly - only the new source_puppy_finder_option_id
-- link below remembers where that puppy row came from.

alter table sales add column if not exists fulfillment_method text
  check (fulfillment_method in ('pickup', 'delivery'));

alter table sales add column if not exists fulfillment_status text not null default 'pending'
  check (fulfillment_status in ('pending', 'scheduled', 'completed'));

alter table sales add column if not exists scheduled_fulfillment_at timestamptz;

alter table sales add column if not exists fulfilled_at timestamptz;

alter table sales add column if not exists fulfillment_notes text;

alter table sales drop constraint if exists sales_fulfillment_status_fulfilled_at_check;
alter table sales add constraint sales_fulfillment_status_fulfilled_at_check
  check ((fulfillment_status = 'completed') = (fulfilled_at is not null));

-- The actual customer-received-the-puppy date is the only thing the
-- affiliate commission hold period is allowed to read (see
-- affiliate_commissions.eligible_at). puppies.sold_at stays a separate,
-- purely financial concept (paid in full) and is never used for this.

-- Financial-completion snapshot - set once, the same way puppies.sold_at
-- already is today (in app/admin/sales/actions.ts logPayment, at the
-- exact moment a NEW payment crosses the sale into fully-paid). Never
-- touched by a later payment correction/delete, matching the existing
-- "corrections don't silently flip status" rule this codebase already
-- follows for puppies.sold_at.
alter table sales add column if not exists paid_in_full_at timestamptz;

-- Generic "left active" fields, shared by both cancellation and refund
-- (a sale is only ever closed one way, never both).
alter table sales add column if not exists closed_at timestamptz;
alter table sales add column if not exists closed_reason text;
alter table sales add column if not exists closed_by uuid references auth.users (id);

-- Affiliate attribution snapshot - set once at sale creation (startSale),
-- never recomputed afterward. Null means an organic/non-referred sale.
alter table sales add column if not exists affiliate_id uuid references affiliates (id);
alter table sales add column if not exists affiliate_attribution_id uuid
  references contact_affiliate_attributions (id);

create index if not exists sales_affiliate_id_idx on sales (affiliate_id);

-- ---------------------------------------------------------------------
-- Canonical Puppy Finder option -> Puppy conversion link (both
-- directions, kept in sync in the same transaction at conversion time).
-- ---------------------------------------------------------------------
alter table puppies add column if not exists source_puppy_finder_option_id uuid
  unique references puppy_finder_options (id);

alter table puppy_finder_options add column if not exists converted_puppy_id uuid
  references puppies (id);
