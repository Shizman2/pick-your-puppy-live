-- Affiliate Program - Phase 5: commissions.
--
-- unique(sale_id) is the DB-level guarantee that a sale can never
-- produce two commissions, no matter how many times commission
-- creation is accidentally invoked (app code inserts with
-- ON CONFLICT (sale_id) DO NOTHING).
--
-- Status lifecycle: pending -> approved -> in_payout -> paid, with
-- void reachable from any of the first three. 'in_payout' exists so a
-- commission already reserved by a not-yet-confirmed payout is visibly
-- distinct from one still sitting free in the approved pool - without
-- it, two payouts could be built from the same approved commission
-- before either is confirmed. There is deliberately no 'reversed'
-- status: a commission that already reached 'paid' stays 'paid'
-- forever even if its sale is later refunded (see flagged_after_close
-- below) - 'paid' is meant to mean money already changed hands, and
-- nothing here should silently imply otherwise.

create table if not exists affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references sales (id),
  affiliate_id uuid not null references affiliates (id),

  amount_cents int not null check (amount_cents > 0),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'in_payout', 'paid', 'void')),

  -- Snapshotted at creation from affiliate_program_settings, so a later
  -- change to commission_hold_days never reaches back and recalculates
  -- the eligibility date of a commission created under the old rule.
  hold_days_snapshot int not null,
  eligible_at timestamptz,

  approved_at timestamptz,

  voided_at timestamptz,
  voided_reason text,
  voided_by uuid references auth.users (id),

  -- Set when this commission's sale is later refunded/cancelled AFTER
  -- the commission already reached 'paid' - status stays 'paid'
  -- (history is never rewritten), this is just a visible marker for
  -- admin review. Whether that ever becomes a real clawback is a later
  -- decision, not part of V1.
  flagged_after_close boolean not null default false,
  flagged_reason text,
  flagged_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_commissions_affiliate_id_idx on affiliate_commissions (affiliate_id, status);
create index if not exists affiliate_commissions_status_idx on affiliate_commissions (status);

alter table affiliate_commissions enable row level security;

-- ---------------------------------------------------------------------
-- Keep eligible_at in sync with sales.fulfilled_at automatically, so it
-- can never be forgotten from a future code path that sets
-- fulfilled_at a different way than today's admin action does. Only
-- ever touches a commission still in 'pending' - once a commission has
-- moved past pending, a later fulfillment correction must not silently
-- change its approval math.
-- ---------------------------------------------------------------------
create or replace function affiliate_commissions_sync_eligible_at()
returns trigger
language plpgsql
as $$
begin
  if new.fulfilled_at is distinct from old.fulfilled_at then
    update affiliate_commissions
    set eligible_at = case
          when new.fulfilled_at is null then null
          else new.fulfilled_at + (hold_days_snapshot || ' days')::interval
        end,
        updated_at = now()
    where sale_id = new.id
      and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists sales_sync_commission_eligible_at on sales;
create trigger sales_sync_commission_eligible_at
  after update of fulfilled_at on sales
  for each row
  execute function affiliate_commissions_sync_eligible_at();
