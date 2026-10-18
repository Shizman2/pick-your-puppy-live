-- AI Sales Assistant - Stage 1a (website chat).
--
-- Four new tables, nothing existing is altered:
--   assistant_settings       one row: on/off/preview, model, limits, budget,
--                            approved business info, sales instructions
--   assistant_conversations  one per chat; identified ONLY by the hash of
--                            a random secret held in an httpOnly cookie
--   assistant_messages       exact model transcript (replayed to the model)
--                            plus what the chat UI shows
--   assistant_usage_daily    token + cost totals per day/model, used for the
--                            server-enforced daily spending cap (no PII)
--
-- RLS is enabled on every table with NO policies: site visitors can never
-- read or write them through the public API. Only server code using the
-- secret key (lib/supabase/admin.ts) touches them.
--
-- Retention: a daily pg_cron job deletes conversations (and, by cascade,
-- their messages) whose last activity is older than
-- assistant_settings.retention_days. Usage totals are kept.
--
-- Must be run manually in the Supabase SQL editor. Until it is, the
-- assistant reports itself unavailable and the chat button never shows.
-- If the pg_cron statements at the bottom fail with a privilege error,
-- enable pg_cron under Database > Extensions and re-run just that part
-- (same as migration 022).

-- ---------------------------------------------------------------------
-- Settings (single row, id = 1)
-- ---------------------------------------------------------------------
create table if not exists assistant_settings (
  id integer primary key default 1 check (id = 1),

  -- off: hidden everywhere. preview: visible only to signed-in admins.
  -- live: visible to every visitor.
  mode text not null default 'off' check (mode in ('off', 'preview', 'live')),

  model text not null default 'claude-sonnet-5-5',
  effort text not null default 'low' check (effort in ('low', 'medium', 'high')),

  -- Server-enforced: once today's (America/New_York) spend reaches this,
  -- the assistant stops answering until tomorrow. 0 = no AI replies.
  daily_budget_usd numeric(10, 2) not null default 5.00 check (daily_budget_usd >= 0),

  max_messages_per_conversation integer not null default 40 check (max_messages_per_conversation between 1 and 200),
  max_messages_per_hour integer not null default 20 check (max_messages_per_hour between 1 and 200),
  max_new_chats_per_ip_per_day integer not null default 10 check (max_new_chats_per_ip_per_day between 1 and 500),
  retention_days integer not null default 90 check (retention_days between 1 and 730),

  greeting text not null default '',
  business_info text not null default '',
  sales_instructions text not null default '',

  updated_at timestamptz not null default now(),
  updated_by text
);

insert into assistant_settings (id, greeting, business_info, sales_instructions)
values (
  1,
  $greet$Hi! I'm the Puppy Plugs AI assistant. I can help you find the right puppy, compare puppies, or answer questions about how buying works. What are you looking for?$greet$,
  $info$DRAFT - review every line before going live. Drafted from the website FAQ; remove anything that is no longer true.

BUYING PROCESS
- Browse available puppies, choose one, reserve it, then pick up or arrange delivery.
- To reserve or to speak with the owner, customers text or call using the Text / Call buttons on the puppy's page.
- A $200 deposit holds a puppy and is applied toward the total price.
- Deposits are refundable if the puppy has a vet-confirmed health issue. Deposits are non-refundable if the buyer simply changes their mind, but we will try to help, and may be able to apply the deposit to a different puppy.
- Payment methods: Zelle, Venmo, CashApp, and bank transfer. Credit cards are not accepted at this time.

HEALTH
- Every puppy is examined by a licensed veterinarian, is up to date on age-appropriate vaccines, has been dewormed, and comes with a full health record.
- 30-day health guarantee: if within 30 days of purchase a licensed vet diagnoses a hereditary or congenital condition, we will work with you to make it right, including a replacement puppy or partial refund.

PICKUP AND DELIVERY
- Local pickup can be arranged.
- Delivery is available anywhere in the United States through professional, licensed pet transport. Delivery fees vary by location and are quoted when you reserve.
- Puppies travel in climate-controlled, comfortable carriers and are never put in cargo. We send updates and photos during transit.
- Local buyers are encouraged to meet the puppy in person. Out-of-state buyers can meet their puppy on a live video call before committing.

COMPLIMENTARY PUPPY BUNDLE (included with every puppy)
- Health guarantee, health and shot records, a starter bag of Diamond puppy food, a brand-new crate, food and water bowls, pee pads, and potty bags. No pet store runs needed.

PUPPY FINDER
- If we don't have the puppy someone wants, our Puppy Finder service searches for one: the customer tells us the breed, size, and features they want at /puppy-finder, we search, they review matches and pick a favorite, reserve, and we arrange pickup or delivery.$info$,
  $sales$- Keep replies short: usually 1-3 sentences, like a friendly text message.
- Ask at most one question at a time.
- When someone is ready to reserve, wants a deposit, or wants to talk to a person, show the contact options so they can text or call the owner directly.$sales$
)
on conflict (id) do nothing;

alter table assistant_settings enable row level security;

-- ---------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------
create table if not exists assistant_conversations (
  id uuid primary key default gen_random_uuid(),

  -- sha256 (hex) of the random secret in the visitor's httpOnly cookie.
  -- The secret itself is never stored, so a database read can't be
  -- replayed as a cookie.
  token_hash text not null unique,

  channel text not null default 'web' check (channel in ('web')),
  -- Started while the assistant was in preview mode (admin testing).
  is_preview boolean not null default false,
  -- Optional link to first-party analytics; never used for access.
  analytics_visitor_id uuid,
  -- Keyed hash of the IP, only for the new-chats-per-IP limit.
  ip_hash text,

  status text not null default 'open' check (status in ('open', 'closed')),
  visitor_message_count integer not null default 0,
  -- Prevents two overlapping turns (double-send) from interleaving.
  turn_locked_until timestamptz,

  last_page_path text,
  last_puppy_id uuid references puppies (id) on delete set null,
  total_cost_usd numeric(12, 6) not null default 0,
  last_error text,

  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index if not exists assistant_conversations_last_message_idx on assistant_conversations (last_message_at);
create index if not exists assistant_conversations_ip_created_idx on assistant_conversations (ip_hash, created_at);

alter table assistant_conversations enable row level security;

-- ---------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------
create table if not exists assistant_messages (
  id bigserial primary key,
  conversation_id uuid not null references assistant_conversations (id) on delete cascade,
  seq integer not null,
  role text not null check (role in ('user', 'assistant')),

  -- Exact Messages API content blocks, replayed to the model unchanged
  -- (append-only history).
  content jsonb not null,

  -- What the chat shows. Null for tool plumbing rows.
  visible_text text,
  -- Puppy ids for listing cards; card details are always re-read from
  -- the puppies table, never stored here.
  card_puppy_ids uuid[],
  show_contact_options boolean not null default false,
  -- Puppy named in the Text/Call options' prefilled message, if any.
  contact_puppy_id uuid,

  model text,
  created_at timestamptz not null default now(),

  unique (conversation_id, seq)
);

create index if not exists assistant_messages_conversation_idx on assistant_messages (conversation_id, seq);
create index if not exists assistant_messages_user_recent_idx on assistant_messages (conversation_id, created_at) where role = 'user' and visible_text is not null;

alter table assistant_messages enable row level security;

-- ---------------------------------------------------------------------
-- Daily usage / spend
-- ---------------------------------------------------------------------
create table if not exists assistant_usage_daily (
  usage_date date not null,
  model text not null,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  primary key (usage_date, model)
);

alter table assistant_usage_daily enable row level security;

-- ---------------------------------------------------------------------
-- Functions (server-only)
-- ---------------------------------------------------------------------

-- Atomic usage increment for one API request.
create or replace function public.assistant_record_usage(
  p_usage_date date,
  p_model text,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_cache_read_tokens bigint,
  p_cache_write_tokens bigint,
  p_cost_usd numeric
)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into assistant_usage_daily as u (
    usage_date, model, requests, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd
  ) values (
    p_usage_date, p_model, 1, p_input_tokens, p_output_tokens, p_cache_read_tokens, p_cache_write_tokens, p_cost_usd
  )
  on conflict (usage_date, model) do update set
    requests = u.requests + 1,
    input_tokens = u.input_tokens + excluded.input_tokens,
    output_tokens = u.output_tokens + excluded.output_tokens,
    cache_read_tokens = u.cache_read_tokens + excluded.cache_read_tokens,
    cache_write_tokens = u.cache_write_tokens + excluded.cache_write_tokens,
    cost_usd = u.cost_usd + excluded.cost_usd;
$$;

-- Claims the conversation for one turn. Returns false if another turn
-- holds an unexpired lock.
create or replace function public.assistant_try_lock_conversation(p_conversation_id uuid, p_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  update assistant_conversations
  set turn_locked_until = now() + make_interval(secs => p_seconds)
  where id = p_conversation_id
    and (turn_locked_until is null or turn_locked_until < now())
  returning id into v_id;
  return v_id is not null;
end;
$$;

-- Deletes conversations past the retention window (messages cascade).
create or replace function public.assistant_delete_expired_conversations()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_days integer;
  v_deleted integer;
begin
  select retention_days into v_days from assistant_settings where id = 1;
  if v_days is null then
    v_days := 90;
  end if;
  delete from assistant_conversations
  where last_message_at < now() - make_interval(days => v_days);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.assistant_record_usage(date, text, bigint, bigint, bigint, bigint, numeric) from public, anon, authenticated;
revoke all on function public.assistant_try_lock_conversation(uuid, integer) from public, anon, authenticated;
revoke all on function public.assistant_delete_expired_conversations() from public, anon, authenticated;
grant execute on function public.assistant_record_usage(date, text, bigint, bigint, bigint, bigint, numeric) to service_role;
grant execute on function public.assistant_try_lock_conversation(uuid, integer) to service_role;
grant execute on function public.assistant_delete_expired_conversations() to service_role;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Daily retention cleanup (pg_cron), 08:15 UTC
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'assistant-retention-cleanup') then
    perform cron.unschedule('assistant-retention-cleanup');
  end if;
end;
$$;

select cron.schedule(
  'assistant-retention-cleanup',
  '15 8 * * *',
  $$select public.assistant_delete_expired_conversations();$$
);
