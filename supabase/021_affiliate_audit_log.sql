-- Affiliate Program - Phase 7: lightweight audit log.
--
-- Same idea as the existing timeline_events/activities tables (contact-
-- scoped history), generalized to the money-affecting affiliate
-- entities: who changed this, what, when, why. Not event sourcing -
-- just enough to answer those four questions for commission voids,
-- manual approvals, attribution reassignments, payout confirmations,
-- and sale refunds/cancellations.

create table if not exists affiliate_audit_log (
  id uuid primary key default gen_random_uuid(),

  entity_type text not null check (entity_type in ('affiliate', 'commission', 'payout', 'attribution', 'sale')),
  entity_id uuid not null,

  action text not null,

  actor_user_id uuid references auth.users (id),
  -- Denormalized snapshot so this row still makes sense in the admin UI
  -- even if the acting admin's account is later removed, and so a
  -- system/cron-driven action has a label too (actor_user_id null).
  actor_label text not null,

  reason text,
  metadata jsonb,

  created_at timestamptz not null default now()
);

create index if not exists affiliate_audit_log_entity_idx on affiliate_audit_log (entity_type, entity_id, created_at desc);

alter table affiliate_audit_log enable row level security;
