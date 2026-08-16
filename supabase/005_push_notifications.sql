-- Run this once in the Supabase SQL Editor.
--
-- Admin-only Web Push notifications. Each admin can register multiple
-- devices/browsers (push_subscriptions), and has one row of on/off
-- toggles for which event types should push (admin_notification_preferences).
--
-- Both tables are locked down with RLS and no public policies - like
-- every other admin table in this app, all access goes through the
-- service-role client from server actions that already check
-- requireAdminUser() first. Nothing here is readable/writable directly
-- from the browser.
--
-- Safe to run more than once: every statement guards with
-- `if not exists`, matching the existing migrations in this folder.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,

  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,

  device_label text,
  enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table push_subscriptions enable row level security;

create index if not exists push_subscriptions_admin_user_id_idx on push_subscriptions(admin_user_id);

create table if not exists admin_notification_preferences (
  admin_user_id uuid primary key references auth.users(id) on delete cascade,

  notify_reservation_requests boolean not null default true,
  notify_puppy_finder_requests boolean not null default true,
  notify_contact_messages boolean not null default true,
  notify_puppy_inquiries boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table admin_notification_preferences enable row level security;
