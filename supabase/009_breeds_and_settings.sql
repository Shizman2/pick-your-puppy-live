-- Centralized breed records (name, expected adult size, description) so
-- one admin edit updates the information for every puppy sharing that
-- breed name. Matched to puppies.breed by name string at read time when
-- the public breed section is eventually built - no change to the
-- puppies table itself is needed for that.
create table if not exists breeds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  expected_adult_size text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table breeds enable row level security;

-- Widen content_blocks.page to allow a new "settings" bucket, used for
-- global site settings (e.g. Seller Phone Number) that aren't tied to
-- any single public page - this reuses the existing content_blocks
-- mechanism instead of creating a whole new settings table.
--
-- "about" is included below even though the app's ContentPage type
-- doesn't use it - it's a pre-existing orphaned value from the old
-- About Us page (removed from the site, see the /about redirect in
-- next.config.js) that already exists on a live row. Keeping it in the
-- allowed list preserves that existing data instead of touching it;
-- cleaning it up is a separate, unrelated task.
alter table content_blocks drop constraint if exists content_blocks_page_check;
alter table content_blocks add constraint content_blocks_page_check
  check (page in ('homepage', 'contact', 'faq', 'puppies', 'footer', 'puppy_finder', 'settings', 'about'));
