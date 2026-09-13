-- Favorites - V1: public favorite/unfavorite, counts, and the data
-- shape a later Puppy Performance tab can build on (recent favorites,
-- favorite -> sale conversion) without needing a schema change then.
--
-- One row per (puppy, visitor), enforced by a unique constraint -
-- toggling flips is_active instead of inserting a new row each time,
-- which is what makes repeated clicking idempotent: no matter how many
-- times one visitor toggles a puppy, their contribution to the public
-- count is always exactly 0 or 1, never more. Rows are never deleted -
-- unfavoriting just sets is_active = false - so this preserves enough
-- history (favorited_at / unfavorited_at) to support "recent
-- favorites" and "favorite -> sale" conversion queries later without
-- rebuilding this table.

create table if not exists puppy_favorites (
  id uuid primary key default gen_random_uuid(),
  puppy_id uuid not null references puppies (id) on delete cascade,

  -- Anonymous-visitor identifier, issued as a long-lived first-party
  -- cookie (see lib/favorites.ts) the first time someone favorites
  -- anything - never tied to a login, since this site has no visitor
  -- accounts. No other personal data is stored here.
  visitor_id uuid not null,

  -- Backfilled once the visitor becomes identifiable (submits any
  -- inquiry form) - see linkFavoritesToContact in lib/favorites.ts,
  -- called from app/api/inquire/route.ts. Null means "still anonymous."
  contact_id uuid references contacts (id) on delete set null,

  is_active boolean not null default true,
  favorited_at timestamptz not null default now(),
  unfavorited_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint puppy_favorites_puppy_visitor_key unique (puppy_id, visitor_id)
);

-- Public favorite counts: "how many are currently active for this puppy."
create index if not exists puppy_favorites_puppy_active_idx
  on puppy_favorites (puppy_id) where is_active;

-- The /favorites page: "everything this visitor currently has active."
create index if not exists puppy_favorites_visitor_active_idx
  on puppy_favorites (visitor_id) where is_active;

create index if not exists puppy_favorites_contact_id_idx on puppy_favorites (contact_id);

alter table puppy_favorites enable row level security;
