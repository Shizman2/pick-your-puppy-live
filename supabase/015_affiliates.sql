-- Affiliate Program - Phase 2: the affiliates table itself.
--
-- One table for both the public application and the ongoing affiliate
-- record (see blueprint discussion) - "pending" is just the status an
-- application starts in. No auth_user_id until approved; an account is
-- only created at approval time via the Supabase Admin API invite flow.

create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid unique references auth.users (id) on delete set null,

  first_name text not null,
  last_name text,
  display_name text,
  email text not null,
  email_normalized text not null,
  phone text,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended', 'rejected')),

  referral_code text not null unique,

  commission_type text not null default 'percent_bp'
    check (commission_type in ('flat_cents', 'percent_bp')),
  commission_flat_cents int,
  commission_percent_bp int,
  constraint affiliates_commission_value_matches_type check (
    (commission_type = 'flat_cents' and commission_flat_cents is not null and commission_percent_bp is null)
    or
    (commission_type = 'percent_bp' and commission_percent_bp is not null and commission_flat_cents is null)
  ),

  -- Minimum information needed to manually send money in V1 - see
  -- blueprint section H. Deliberately no bank account/routing number
  -- columns: those belong to a real payout provider's own secure
  -- onboarding, never to this table.
  payout_method text check (payout_method in ('cash_app', 'zelle', 'venmo', 'paypal', 'check', 'other')),
  payout_handle text,
  payout_notes text,

  -- Public application fields - both applicant-authored, kept distinct
  -- from each other (one is a specific prompt, one is an open "anything
  -- else" field) and from admin-internal `notes` below.
  social_url text,
  promotion_plan text,
  application_notes text,

  -- Admin-internal notes - never shown to the applicant/affiliate,
  -- distinct from the two applicant-authored fields above.
  notes text,

  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id),
  rejected_at timestamptz,
  rejected_by uuid references auth.users (id),
  rejected_reason text,
  suspended_at timestamptz,
  suspended_by uuid references auth.users (id),
  suspended_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists affiliates_email_normalized_idx on affiliates (email_normalized);
create index if not exists affiliates_status_idx on affiliates (status);
create index if not exists affiliates_auth_user_id_idx on affiliates (auth_user_id);

alter table affiliates enable row level security;
