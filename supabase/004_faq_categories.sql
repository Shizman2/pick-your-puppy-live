-- Run this once in the Supabase SQL Editor.
--
-- Adds category/section grouping to the FAQ page. faq_items previously
-- had no way to be grouped - this adds a faq_categories table and links
-- each faq_items row to one via category_id, plus an is_visible flag so
-- a question can be hidden without deleting it.
--
-- Safe to run more than once: every statement guards with
-- `if not exists` / `on conflict do nothing`, matching the existing
-- migrations in this folder.

create table if not exists faq_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table faq_categories enable row level security;

alter table faq_items add column if not exists category_id uuid references faq_categories(id);
alter table faq_items add column if not exists is_visible boolean not null default true;

-- Seed the four categories from the approved redesign, in display order.
insert into faq_categories (title, icon, display_order)
select v.title, v.icon, v.display_order
from (values
  ('Getting Your Puppy', 'paw', 1),
  ('Payments & Pricing', 'tag', 2),
  ('Health & Care', 'shield-check', 3),
  ('Pickup & Delivery', 'truck', 4)
) as v(title, icon, display_order)
where not exists (select 1 from faq_categories where title = v.title);

-- Backfill the existing flat faq_items rows into the matching category,
-- by exact question text (all 10 real questions the site currently has).
-- Anything not matched below (e.g. stray test rows) falls back to
-- "Getting Your Puppy" so no row is left without a category - review
-- and move/delete those manually afterward if needed.
update faq_items set category_id = (select id from faq_categories where title = 'Getting Your Puppy')
where question in ('How do I reserve a puppy?', 'What breeds do you carry?');

update faq_items set category_id = (select id from faq_categories where title = 'Payments & Pricing')
where question in ('How much is the deposit?', 'What payment methods do you accept?', 'What if I change my mind?');

update faq_items set category_id = (select id from faq_categories where title = 'Health & Care')
where question in ('Are the puppies vet checked?', 'Is there a health guarantee?');

update faq_items set category_id = (select id from faq_categories where title = 'Pickup & Delivery')
where question in ('Do you offer delivery?', 'Can I meet the puppy before buying?', 'How are the puppies transported?');

update faq_items set category_id = (select id from faq_categories where title = 'Getting Your Puppy')
where category_id is null;

-- Every FAQ item belongs to a category going forward.
alter table faq_items alter column category_id set not null;

create index if not exists faq_items_category_id_idx on faq_items(category_id);
