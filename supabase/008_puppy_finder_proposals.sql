-- Personalized Puppy Finder proposals: a contact can receive one or more
-- proposals over time (e.g. if they submit the Puppy Finder form again
-- later), each with its own private access token and its own set of
-- custom puppy options. Deliberately kept separate from `puppies`/
-- `sales`/`payments` - these are not inventory, and no online payment
-- processing happens here (deposit confirmation is a manual toggle,
-- not a real transaction).

create table if not exists puppy_finder_proposals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  inquiry_id uuid references inquiries (id) on delete set null,

  access_token text not null unique,

  status text not null default 'proposed'
    check (status in ('proposed', 'selected', 'deposit_confirmed')),
  deposit_confirmed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists puppy_finder_proposals_contact_id_idx
  on puppy_finder_proposals (contact_id);

alter table puppy_finder_proposals enable row level security;

create table if not exists puppy_finder_options (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references puppy_finder_proposals (id) on delete cascade,

  -- Every puppy field below is optional by design - the admin fills in
  -- only what they actually have for this specific found puppy. A null
  -- field means "don't render this row" on the customer's page, not
  -- "show it blank".
  name text,
  breed text,
  gender text,
  age_text text,
  color text,
  size_text text,
  price_cents integer,
  description text,
  health_notes text,
  photo_urls text[] not null default '{}',

  display_order integer not null default 0,

  -- 'withdrawn' means the admin pulled this option (e.g. it's no longer
  -- available) - it stays visible to the customer marked "No Longer
  -- Available" rather than disappearing, and can no longer be chosen.
  status text not null default 'active'
    check (status in ('active', 'withdrawn')),

  is_selected boolean not null default false,
  selected_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists puppy_finder_options_proposal_id_idx
  on puppy_finder_options (proposal_id);

-- Enforce "only one selected option per proposal" at the database level,
-- not just in application code.
create unique index if not exists puppy_finder_options_one_selected_idx
  on puppy_finder_options (proposal_id)
  where is_selected;

alter table puppy_finder_options enable row level security;

-- Extend the existing push-notification preference table with a toggle
-- for the one new event type this feature introduces (customer selected
-- a Puppy Finder option). Defaults to on, matching the existing four.
alter table admin_notification_preferences
  add column if not exists notify_puppy_finder_selections boolean not null default true;
