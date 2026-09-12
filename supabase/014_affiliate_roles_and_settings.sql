-- Affiliate Program - Phase 1: roles + program-wide settings.
--
-- Today any authenticated Supabase user passes the admin guard in
-- middleware.ts (checks "is there a session", not "does this session
-- hold the admin role"). That is not safe once affiliate accounts
-- exist in the same auth.users pool, so this introduces a real
-- role table and backfills every CURRENT auth user as 'admin' -
-- which is simply making explicit the access they already have today.
-- Going forward, affiliate accounts get 'affiliate' instead, never
-- 'admin'.

create table if not exists user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'affiliate')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table user_roles enable row level security;

-- Backfill: every account that exists right now was, by definition,
-- already being treated as an admin (that's the entire current
-- security model). Make that explicit before the guard tightens.
insert into user_roles (user_id, role)
select id, 'admin' from auth.users
on conflict do nothing;

-- ---------------------------------------------------------------------
-- affiliate_program_settings - single-row program configuration.
-- ---------------------------------------------------------------------
-- The boolean primary key + check is a standard "exactly one row"
-- trick: a boolean column can only ever hold two values, and the
-- check pins it to true, so a second insert attempt collides with the
-- primary key instead of silently creating a second config row.
create table if not exists affiliate_program_settings (
  id boolean primary key default true check (id = true),

  commission_hold_days int not null default 10,
  attribution_window_days int not null default 30,

  default_commission_type text not null default 'percent_bp'
    check (default_commission_type in ('flat_cents', 'percent_bp')),
  default_commission_value int not null default 1000, -- 1000 bp = 10%

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

insert into affiliate_program_settings (id) values (true)
on conflict do nothing;

alter table affiliate_program_settings enable row level security;
