-- Run this once in the Supabase SQL Editor.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),

  show_at timestamptz not null,
  countdown_starts_at timestamptz not null,
  show_timezone text not null default 'America/New_York',
  countdown_start_mode text not null default 'immediate' check (countdown_start_mode in ('immediate', 'custom')),

  featured_image_url text,

  scheduled_headline text not null default 'The next Pick Your Puppy Live show is coming soon.',
  scheduled_message text not null default 'The waiting room opens soon.',
  scheduled_helper_message text not null default 'Keep this page bookmarked. Return when the waiting room opens.',

  countdown_headline text not null default 'The Live Puppy Show Starts In',
  countdown_helper_message text not null default 'Keep this page open. The live show will begin here automatically.',

  live_headline text not null default E'WE\u2019RE LIVE!',
  live_message text not null default 'The show is happening now.',

  private_waiting_message text not null default 'Private waiting room for registered attendees.',
  private_live_message text not null default 'This link is for registered attendees only.',

  live_show_link text,
  timer_completion_behavior text not null default 'show_button',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: locked down by default. The public page and admin
-- dashboard both go through server-side code using a trusted connection,
-- not direct client-side table access, so no public read/write policies
-- are added here. This keeps the live_show_link and all settings
-- inaccessible to anyone querying the table directly from a browser.
alter table events enable row level security;

-- One sample event so the app has something to point at immediately.
insert into events (slug, status, show_at, countdown_starts_at, show_timezone, live_show_link)
values (
  'sample-show',
  'published',
  '2026-07-25T23:00:00.000Z',
  '2026-07-01T00:00:00.000Z',
  'America/New_York',
  'https://pickyourpuppylive.com/live/show'
)
on conflict (slug) do nothing;
