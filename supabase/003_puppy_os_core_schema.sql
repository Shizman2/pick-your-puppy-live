-- Puppy OS Phase 1A - core CRM schema.
--
-- IMPORTANT CONTEXT: this schema was originally approved and applied
-- directly in the Supabase SQL editor in an earlier session, without
-- ever being committed here. This file recreates it so the repository
-- becomes the source of truth going forward, instead of the live
-- database being the only record of what exists.
--
-- Every statement below is written to be safe to run against a database
-- that already has these tables (via `create table if not exists` and
-- `add column if not exists`), so running this file does not error out
-- or duplicate anything already live. It also adds the new `is_read`
-- column on `messages` (see Checkpoint 3 handoff), which did not exist
-- in the original approved migration.
--
-- From this point forward: schema changes should be written here (as a
-- new numbered migration file) BEFORE being run in Supabase, not the
-- other way around.

-- ---------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),

  first_name text not null,
  last_name text,
  display_name text,

  phone text,
  phone_normalized text,
  email text,
  email_normalized text,

  city text,
  state text,
  preferred_contact_method text,
  consent_to_contact boolean not null default false,

  source text,

  status text not null default 'new'
    check (status in ('new', 'contacted', 'interested', 'follow_up', 'reserved', 'customer', 'closed')),
  closed_reason text,
  interest_level text
    check (interest_level in ('low', 'medium', 'high')),
  lead_score integer not null default 0
    check (lead_score >= 0 and lead_score <= 100),

  last_activity_at timestamptz,
  next_follow_up_at timestamptz,
  needs_duplicate_review boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_phone_normalized_idx on contacts (phone_normalized);
create index if not exists contacts_email_normalized_idx on contacts (email_normalized);
create index if not exists contacts_status_idx on contacts (status);
create index if not exists contacts_next_follow_up_at_idx on contacts (next_follow_up_at);

alter table contacts enable row level security;

-- ---------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,

  inquiry_type text not null
    check (inquiry_type in ('puppy_interest', 'puppy_finder', 'pypl', 'general')),
  form_data jsonb,

  -- puppy_interest fields
  puppy_name text,
  puppy_slug text,
  source_url text,
  ready_for_deposit text,

  -- puppy_finder fields
  breed text,
  gender_preference text,
  budget_min numeric,
  budget_max numeric,
  timeframe text,
  delivery_needed boolean,

  -- pypl fields
  event_id uuid references events (id),
  event_title_snapshot text,
  event_show_at_snapshot timestamptz,

  -- general fields
  subject text,

  created_at timestamptz not null default now()
);

create index if not exists inquiries_contact_id_idx on inquiries (contact_id);
create index if not exists inquiries_inquiry_type_idx on inquiries (inquiry_type);

alter table inquiries enable row level security;

-- ---------------------------------------------------------------------
-- interests
-- ---------------------------------------------------------------------
create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  inquiry_id uuid references inquiries (id) on delete set null,

  interest_type text not null
    check (interest_type in ('puppy', 'breed', 'pypl', 'general')),
  label text,

  -- Whether this interest should still be treated as "current" for the
  -- contact (e.g. shown as a badge on the Contacts list). Nothing
  -- flips this to false automatically yet - it exists so a future
  -- checkpoint (e.g. marking a puppy sold/reserved) can retire stale
  -- interests without deleting the historical row.
  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

create index if not exists interests_contact_id_idx on interests (contact_id);

alter table interests enable row level security;

-- ---------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,

  conversation_type text not null default 'general',
  status text not null default 'open',
  last_message_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists conversations_contact_id_idx on conversations (contact_id);

alter table conversations enable row level security;

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,

  direction text not null check (direction in ('inbound', 'outbound')),
  sent_by text,
  channel text,
  body text,
  status text,

  created_at timestamptz not null default now()
);

-- New in this checkpoint: unread tracking for the Contacts list "Unread"
-- column. Defaults to true so any already-existing rows (mostly
-- outbound, if any exist) don't retroactively show up as unread.
-- Application code is responsible for explicitly inserting inbound
-- messages with is_read = false; outbound messages can rely on the
-- default. Marking inbound messages read again (when a staff member
-- opens the conversation) is deferred to the Contact Profile /
-- Message Center checkpoint, since that's the page where a
-- conversation actually gets "opened".
alter table messages add column if not exists is_read boolean not null default true;

create index if not exists messages_conversation_id_idx on messages (conversation_id);
create index if not exists messages_contact_id_idx on messages (contact_id);
create index if not exists messages_unread_idx on messages (contact_id)
  where direction = 'inbound' and is_read = false;

alter table messages enable row level security;

-- ---------------------------------------------------------------------
-- notes (manual staff notes on a contact)
-- ---------------------------------------------------------------------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,

  author text,
  body text not null,

  created_at timestamptz not null default now()
);

create index if not exists notes_contact_id_idx on notes (contact_id);

alter table notes enable row level security;

-- ---------------------------------------------------------------------
-- activities (system-logged actions, e.g. "deposit received")
-- ---------------------------------------------------------------------
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,

  activity_type text not null,
  description text,
  metadata jsonb,

  created_at timestamptz not null default now()
);

create index if not exists activities_contact_id_idx on activities (contact_id);

alter table activities enable row level security;

-- ---------------------------------------------------------------------
-- timeline_events (chronological feed shown on a contact profile)
-- ---------------------------------------------------------------------
create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,

  event_type text not null,
  description text,
  metadata jsonb,

  created_at timestamptz not null default now()
);

create index if not exists timeline_events_contact_id_idx on timeline_events (contact_id);

alter table timeline_events enable row level security;

-- ---------------------------------------------------------------------
-- tags / contact_tags
-- ---------------------------------------------------------------------
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text
);

alter table tags enable row level security;

create table if not exists contact_tags (
  contact_id uuid not null references contacts (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

alter table contact_tags enable row level security;

-- Row Level Security note: same pattern as the events table (see
-- 001_create_events_table.sql) - locked down with no public policies.
-- Every read/write goes through server-side code using the trusted
-- admin client (lib/supabase/admin.ts), never direct client-side table
-- access, so no policies are defined here on purpose.
