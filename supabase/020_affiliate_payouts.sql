-- Affiliate Program - Phase 6: manual payouts.
--
-- Status wording is 'pending' (not 'draft'): once a payout is created
-- its commission set is locked immediately - there's no "still
-- editable" draft state, the only edit available is voiding the whole
-- payout and creating a replacement. 'pending' means "created, money
-- not yet confirmed sent."

create table if not exists affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates (id),

  status text not null default 'pending' check (status in ('pending', 'paid', 'void')),

  -- Snapshotted at creation (sum of the commissions attached at that
  -- instant) - never recalculated afterward, since the commission set
  -- is locked from the moment the payout exists.
  total_amount_cents int not null check (total_amount_cents > 0),

  payout_method text,
  payout_reference text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  paid_at timestamptz,
  paid_by uuid references auth.users (id),
  voided_at timestamptz,
  voided_by uuid references auth.users (id),
  voided_reason text
);

create index if not exists affiliate_payouts_affiliate_id_idx on affiliate_payouts (affiliate_id, status);

alter table affiliate_payouts enable row level security;

-- ---------------------------------------------------------------------
-- affiliate_payout_commissions - the junction table, kept as permanent
-- history. A voided payout's rows are NEVER deleted (is_active just
-- flips to false) - that preserves the full "this commission sat in
-- payout #5 for two weeks before moving to payout #7" history the
-- blueprint explicitly asked to keep.
--
-- The partial unique index - not a plain UNIQUE(commission_id) - is
-- what makes a voided-then-replaced payout possible at all: a plain
-- constraint would permanently block a commission from ever being
-- placed in a second payout, because the first (voided) junction row
-- would still be occupying that unique slot forever. Restricting the
-- uniqueness to `where is_active` means a commission can have
-- unlimited historical (inactive) junction rows, but only one ACTIVE
-- one at a time - exactly "cannot appear in two active payouts."
-- ---------------------------------------------------------------------
create table if not exists affiliate_payout_commissions (
  payout_id uuid not null references affiliate_payouts (id),
  commission_id uuid not null references affiliate_commissions (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (payout_id, commission_id)
);

create unique index if not exists affiliate_payout_commissions_active_idx
  on affiliate_payout_commissions (commission_id)
  where is_active;

alter table affiliate_payout_commissions enable row level security;

-- ---------------------------------------------------------------------
-- Three atomic RPCs. Each is one transaction end-to-end, which matters
-- here specifically because supabase-js cannot make several separate
-- .from() calls atomic on its own - a partial failure between "insert
-- payout" and "update commissions" would leave real money in an
-- inconsistent state.
-- ---------------------------------------------------------------------

create or replace function create_affiliate_payout(
  p_affiliate_id uuid,
  p_commission_ids uuid[],
  p_payout_method text,
  p_payout_reference text,
  p_created_by uuid
)
returns uuid
language plpgsql
as $$
declare
  v_payout_id uuid;
  v_total_cents int;
  v_matched_count int;
begin
  select coalesce(sum(amount_cents), 0), count(*) into v_total_cents, v_matched_count
  from affiliate_commissions
  where id = any(p_commission_ids)
    and affiliate_id = p_affiliate_id
    and status = 'approved';

  if v_matched_count != array_length(p_commission_ids, 1) then
    raise exception 'One or more commissions are not approved/available or do not belong to this affiliate.';
  end if;

  if v_total_cents <= 0 then
    raise exception 'No eligible approved commissions found for this affiliate.';
  end if;

  insert into affiliate_payouts (affiliate_id, total_amount_cents, payout_method, payout_reference, created_by)
  values (p_affiliate_id, v_total_cents, p_payout_method, p_payout_reference, p_created_by)
  returning id into v_payout_id;

  insert into affiliate_payout_commissions (payout_id, commission_id)
  select v_payout_id, c.id
  from affiliate_commissions c
  where c.id = any(p_commission_ids);

  update affiliate_commissions
  set status = 'in_payout', updated_at = now()
  where id = any(p_commission_ids);

  return v_payout_id;
end;
$$;

create or replace function mark_affiliate_payout_paid(
  p_payout_id uuid,
  p_paid_by uuid
)
returns void
language plpgsql
as $$
begin
  update affiliate_payouts
  set status = 'paid', paid_at = now(), paid_by = p_paid_by
  where id = p_payout_id and status = 'pending';

  if not found then
    raise exception 'Payout not found or not in pending status.';
  end if;

  update affiliate_commissions
  set status = 'paid', updated_at = now()
  where id in (
    select commission_id from affiliate_payout_commissions
    where payout_id = p_payout_id and is_active
  );
end;
$$;

create or replace function void_affiliate_payout(
  p_payout_id uuid,
  p_voided_by uuid,
  p_reason text
)
returns void
language plpgsql
as $$
begin
  update affiliate_payouts
  set status = 'void', voided_at = now(), voided_by = p_voided_by, voided_reason = p_reason
  where id = p_payout_id and status = 'pending';

  if not found then
    raise exception 'Payout not found or not in pending status (only a pending payout can be voided).';
  end if;

  update affiliate_payout_commissions
  set is_active = false
  where payout_id = p_payout_id;

  update affiliate_commissions
  set status = 'approved', updated_at = now()
  where id in (
    select commission_id from affiliate_payout_commissions
    where payout_id = p_payout_id
  ) and status = 'in_payout';
end;
$$;
