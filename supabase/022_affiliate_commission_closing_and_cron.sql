-- Affiliate Program - Phase 8: the shared refund/cancel side-effect
-- function, and automatic commission approval.

-- ---------------------------------------------------------------------
-- close_sale - the ONE function both refundSale and cancelSale call
-- (see blueprint section B: cancellation gets identical commission
-- side effects to refund, so this is written once, not duplicated).
--
-- Puppy status side effect, per explicit instruction: a cancelled sale
-- returns its puppy to 'available' when safe (no other active sale for
-- that puppy, and the puppy was actually in a reserved-for-this-sale
-- state to begin with); a refunded sale never auto-reverts the puppy -
-- that's left for deliberate admin review.
-- ---------------------------------------------------------------------
create or replace function close_sale(
  p_sale_id uuid,
  p_new_status text,
  p_reason text,
  p_closed_by uuid,
  p_actor_label text
)
returns void
language plpgsql
as $$
declare
  v_puppy_id uuid;
  v_other_active_sales int;
  v_commission_id uuid;
  v_commission_status text;
begin
  if p_new_status not in ('cancelled', 'refunded') then
    raise exception 'close_sale only accepts cancelled or refunded, got %', p_new_status;
  end if;

  update sales
  set status = p_new_status, closed_at = now(), closed_reason = p_reason, closed_by = p_closed_by, updated_at = now()
  where id = p_sale_id and status = 'active'
  returning puppy_id into v_puppy_id;

  if v_puppy_id is null then
    raise exception 'Sale not found or not active.';
  end if;

  insert into affiliate_audit_log (entity_type, entity_id, action, actor_user_id, actor_label, reason)
  values ('sale', p_sale_id, p_new_status, p_closed_by, p_actor_label, p_reason);

  if p_new_status = 'cancelled' then
    select count(*) into v_other_active_sales
    from sales where puppy_id = v_puppy_id and status = 'active' and id <> p_sale_id;

    if v_other_active_sales = 0 then
      update puppies
      set status = 'available', sold_at = null, updated_at = now()
      where id = v_puppy_id and status in ('hold', 'sold');
    end if;
  end if;

  select id, status into v_commission_id, v_commission_status
  from affiliate_commissions where sale_id = p_sale_id;

  if v_commission_id is not null then
    if v_commission_status in ('pending', 'approved', 'in_payout') then
      update affiliate_commissions
      set status = 'void', voided_at = now(), voided_reason = p_reason, voided_by = p_closed_by, updated_at = now()
      where id = v_commission_id;

      insert into affiliate_audit_log (entity_type, entity_id, action, actor_user_id, actor_label, reason)
      values ('commission', v_commission_id, 'voided', p_closed_by, p_actor_label, p_reason);
    elsif v_commission_status = 'paid' then
      update affiliate_commissions
      set flagged_after_close = true, flagged_reason = p_reason, flagged_at = now(), updated_at = now()
      where id = v_commission_id;

      insert into affiliate_audit_log (entity_type, entity_id, action, actor_user_id, actor_label, reason)
      values ('commission', v_commission_id, 'flagged_after_close', p_closed_by, p_actor_label, p_reason);
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Automatic pending -> approved approval. Idempotent by construction:
-- the WHERE clause only ever matches rows currently 'pending' and
-- meeting every condition, so running this every 15 minutes forever
-- never re-touches an already-approved/voided/paid row and never
-- approves a sale that isn't active, fulfilled, and paid in full.
-- ---------------------------------------------------------------------
create or replace function approve_eligible_commissions()
returns void
language plpgsql
as $$
begin
  with newly_approved as (
    update affiliate_commissions c
    set status = 'approved', approved_at = now(), updated_at = now()
    from sales s
    where c.sale_id = s.id
      and c.status = 'pending'
      and s.status = 'active'
      and s.fulfilled_at is not null
      and c.eligible_at is not null
      and c.eligible_at <= now()
      and s.paid_in_full_at is not null
    returning c.id, c.sale_id
  )
  insert into affiliate_audit_log (entity_type, entity_id, action, actor_label, metadata)
  select 'commission', id, 'auto_approved', 'system:cron', jsonb_build_object('sale_id', sale_id)
  from newly_approved;
end;
$$;

-- ---------------------------------------------------------------------
-- pg_cron registration. If this statement fails with an insufficient-
-- privilege error, enable the pg_cron extension from the Supabase
-- Dashboard (Database -> Extensions) instead, then re-run just the
-- block below.
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'affiliate-commission-auto-approve') then
    perform cron.unschedule('affiliate-commission-auto-approve');
  end if;
end $$;

select cron.schedule(
  'affiliate-commission-auto-approve',
  '*/15 * * * *',
  'select approve_eligible_commissions();'
);
