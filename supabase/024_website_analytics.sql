-- Website Analytics V1 - first-party visitor -> session -> event tracking
-- for the public Puppy Plugs website only (NOT the GHL evergreen funnel).
--
-- Entirely separate system from puppy_favorites (pp_visitor cookie) and
-- the affiliate attribution system (ppl_aff cookie / affiliate_clicks /
-- contact_affiliate_attributions) - no shared cookies, no shared tables,
-- no shared writes, no changes to either of those systems.
--
-- RLS is enabled with NO public policies on all three tables below,
-- mirroring affiliate_clicks: every read and write happens server-side
-- through the service-role client (lib/supabase/admin.ts). No browser
-- ever talks to these tables directly - all writes go through
-- app/api/analytics/track/route.ts, all admin reads go through
-- lib/analytics/queries.ts.
--
-- No IP address, no user agent, no name/email/phone is stored in any of
-- these tables - see lib/analytics/botDetection.ts for how a user-agent
-- header is inspected transiently (never persisted) purely to decide
-- whether to record an event at all.

-- ---------------------------------------------------------------------
-- analytics_visitors - one row per anonymous browser/device, identified
-- by the long-lived pp_av cookie (see lib/analytics/constants.ts). The
-- row's id IS the cookie value, minted client-visit-triggered on first
-- contact - there is no separate surrogate key.
-- ---------------------------------------------------------------------
create table if not exists analytics_visitors (
  id uuid primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table analytics_visitors enable row level security;

-- ---------------------------------------------------------------------
-- analytics_sessions - one row per visit, closed by a 30-minute
-- inactivity timeout (see lib/analytics/ingest.ts). A visitor can have
-- many sessions over time (e.g. one Monday, another Wednesday) while
-- remaining a single visitor. traffic_source/utm_*/referrer are
-- captured once, at session start, from that session's landing page -
-- later page views within the same session never overwrite them.
-- current_path/current_puppy_id are the only columns updated on every
-- subsequent event in the session; they're what "Online Now" reads.
-- ---------------------------------------------------------------------
create table if not exists analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references analytics_visitors (id) on delete cascade,

  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),

  entry_path text,
  current_path text,
  current_puppy_id uuid references puppies (id) on delete set null,

  referrer text,
  traffic_source text not null default 'direct'
    check (traffic_source in ('facebook_instagram', 'google', 'direct', 'referral_other')),

  -- Preserved verbatim even though the V1 dashboard only surfaces the
  -- simplified traffic_source bucket above - kept for deeper campaign
  -- attribution work later (see the approved audit, section 12).
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
);

alter table analytics_sessions enable row level security;

create index if not exists analytics_sessions_visitor_idx on analytics_sessions (visitor_id);

-- Powers the Online Now query ("sessions active in the last ~2 minutes")
-- and the 30-minute-inactivity session-resolution lookup.
create index if not exists analytics_sessions_last_activity_idx on analytics_sessions (last_activity_at);

-- ---------------------------------------------------------------------
-- analytics_events - the append-only log: page_view, puppy_view, or
-- cta_click. bigserial (not uuid) on purpose - this is by far the
-- highest-volume table in the database and a sequential bigint is
-- materially cheaper to index/insert at that volume than a uuid would
-- be. This is a deliberate, called-out deviation from this project's
-- usual uuid-everywhere convention; every other analytics table above
-- stays uuid since visitor_id IS the cookie value.
-- ---------------------------------------------------------------------
create table if not exists analytics_events (
  id bigserial primary key,
  visitor_id uuid not null references analytics_visitors (id) on delete cascade,
  session_id uuid not null references analytics_sessions (id) on delete cascade,

  event_type text not null check (event_type in ('page_view', 'puppy_view', 'cta_click')),
  path text,
  puppy_id uuid references puppies (id) on delete set null,

  -- Fixed, small vocabulary of the four approved V1 CTAs - not a
  -- free-for-all tracking key. Null for page_view/puppy_view rows.
  cta_key text check (cta_key in ('call_now', 'im_interested', 'puppy_finder', 'see_available_puppies')),

  occurred_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

-- Every dashboard query filters by a date range on occurred_at first.
create index if not exists analytics_events_occurred_idx on analytics_events (occurred_at);

-- Per-metric counts (Page Views / Puppy Views / CTA Clicks) over a date range.
create index if not exists analytics_events_type_occurred_idx on analytics_events (event_type, occurred_at);

-- Most Viewed Puppies grouping.
create index if not exists analytics_events_puppy_idx on analytics_events (puppy_id) where puppy_id is not null;

-- CTA Activity grouping.
create index if not exists analytics_events_cta_idx on analytics_events (cta_key) where cta_key is not null;

create index if not exists analytics_events_session_idx on analytics_events (session_id);

-- Puppy-view repeat-protection lookup: "has this visitor already
-- generated a puppy_view for this puppy within the cooldown window?"
-- Partial (event_type = 'puppy_view' only) since page_view rows are
-- never part of that check.
create index if not exists analytics_events_puppy_view_dedup_idx
  on analytics_events (visitor_id, puppy_id, occurred_at)
  where event_type = 'puppy_view';
