-- Affiliate Program - Phase 3: click tracking + the Contact-level
-- attribution ledger.
--
-- affiliate_clicks is deliberately narrow (no IP/UA capture in V1).
-- window_days_snapshot + expires_at are computed ONCE at insert time
-- from the program setting in effect at that moment, so a later change
-- to attribution_window_days never reaches back and stretches a click
-- that already happened.

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates (id) on delete cascade,
  referral_code text not null,
  landing_path text,

  clicked_at timestamptz not null default now(),
  window_days_snapshot int not null,
  expires_at timestamptz not null,

  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_affiliate_id_idx on affiliate_clicks (affiliate_id, clicked_at);

alter table affiliate_clicks enable row level security;

-- ---------------------------------------------------------------------
-- contact_affiliate_attributions - append-only ledger. Never UPDATE a
-- row here; every click or manual reassignment is a new row, and "who
-- owns this contact right now" is resolved by querying this table, not
-- by reading a mutable column anywhere else.
-- ---------------------------------------------------------------------
create table if not exists contact_affiliate_attributions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  affiliate_id uuid not null references affiliates (id),

  source text not null check (source in ('click', 'manual_admin')),
  click_id uuid references affiliate_clicks (id),
  referral_code text not null,

  -- For 'click' rows this is copied verbatim from affiliate_clicks.expires_at
  -- at insert time - NEVER recomputed from attributed_at. The window is
  -- anchored to when the click happened, not to when a later form
  -- submission happened to resolve into this ledger row.
  attributed_at timestamptz not null default now(),
  expires_at timestamptz not null,

  assigned_by uuid references auth.users (id),
  reason text,

  created_at timestamptz not null default now(),

  constraint contact_affiliate_attributions_click_source check (
    (source = 'click' and click_id is not null)
    or
    (source = 'manual_admin' and click_id is null)
  )
);

create index if not exists contact_affiliate_attributions_contact_id_idx
  on contact_affiliate_attributions (contact_id, attributed_at desc);

-- A given Contact + click can only ever produce one ledger row - repeat
-- form submissions on the same cookie/click are free no-ops via
-- ON CONFLICT, not unbounded row growth. This is a plain (non-partial)
-- composite unique constraint deliberately, not a partial index: a
-- partial index's WHERE clause can't be expressed in PostgREST/
-- supabase-js's upsert(onConflict: ...) conflict-target inference, and
-- it isn't needed for correctness anyway - standard SQL NULL-distinctness
-- already means manual rows (click_id null) never collide with each
-- other, so only real click_id values are ever deduplicated.
alter table contact_affiliate_attributions drop constraint if exists contact_affiliate_attributions_contact_click_key;
alter table contact_affiliate_attributions add constraint contact_affiliate_attributions_contact_click_key
  unique (contact_id, click_id);

alter table contact_affiliate_attributions enable row level security;
