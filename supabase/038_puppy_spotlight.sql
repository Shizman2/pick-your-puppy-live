-- Puppy Spotlight ("Special Opportunity") on /puppies.
--
-- A puppy flagged is_spotlight is shown in a full-width special card at
-- spotlight_price_cents instead of as a normal grid card. Its normal
-- price_cents / sale_price_cents are left untouched, so turning the
-- spotlight off returns it to normal inventory at its normal price.
-- Public display additionally requires show_on_website and status <> 'sold'
-- (enforced in the app query).
--
-- Additive only: new columns, existing rows default to not spotlighted.

alter table puppies add column if not exists is_spotlight boolean not null default false;
alter table puppies add column if not exists spotlight_price_cents integer;
alter table puppies add column if not exists spotlight_headline text;
alter table puppies add column if not exists spotlight_message text;

-- An active spotlight must have a positive special price.
alter table puppies drop constraint if exists puppies_spotlight_price_check;
alter table puppies add constraint puppies_spotlight_price_check
  check (not is_spotlight or (spotlight_price_cents is not null and spotlight_price_cents > 0));

-- V1: at most ONE spotlighted puppy at a time (backstop for the admin check).
create unique index if not exists puppies_single_spotlight_idx on puppies ((true)) where is_spotlight;
