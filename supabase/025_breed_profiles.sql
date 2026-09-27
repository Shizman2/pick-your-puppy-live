-- Extends the existing `breeds` table (see 009_breeds_and_settings.sql)
-- with the structured "Breed Profile" fields shown on individual puppy
-- detail pages. Purely additive - every new column is nullable text
-- (or a boolean defaulting to false) added with IF NOT EXISTS, so this
-- is safe to run against the existing (currently empty) breeds table
-- without touching any existing row.
--
-- expected_adult_size and description already exist and are reused as
-- "Typical Adult Weight" and "What [Breed] Life Is Like" respectively -
-- no new columns needed for those two.
alter table breeds add column if not exists short_name text;
alter table breeds add column if not exists personality text;
alter table breeds add column if not exists energy_level text;
alter table breeds add column if not exists grooming_level text;
alter table breeds add column if not exists living_space_fit text;
alter table breeds add column if not exists companion_style text;
alter table breeds add column if not exists good_to_know text;
alter table breeds add column if not exists profile_image_url text;

-- Explicit publication control, independent of whether every field is
-- filled in - defaults to false so newly-added breeds never appear
-- publicly until an admin deliberately turns this on.
alter table breeds add column if not exists show_profile boolean not null default false;
