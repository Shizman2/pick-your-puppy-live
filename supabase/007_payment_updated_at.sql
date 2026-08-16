-- Run this once in the Supabase SQL Editor.
--
-- Adds updated_at to payments so an edited transaction can be
-- distinguished from one that's never been touched, without overwriting
-- created_at (the original entry date). Matches the created_at/updated_at
-- pattern already used on every other table in this app.

alter table payments add column if not exists updated_at timestamptz not null default now();
