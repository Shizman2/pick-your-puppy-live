-- Preserves which analytics visitor/session produced a given inquiry,
-- for future ad -> visitor -> lead -> sale attribution work (see the
-- approved website/landing-page analytics audit). Captured going
-- forward only - existing inquiries keep both columns null, and
-- nothing here retroactively guesses their attribution.
--
-- Deliberately NOT a foreign key to analytics_visitors/analytics_sessions:
-- these values come from the pp_av/pp_as httpOnly cookies, read directly
-- from the incoming request at submission time (see
-- app/api/inquire/route.ts). Those cookies can only ever be set by our
-- own server, but a foreign key here would still mean any malformed or
-- stale cookie value could cause the ENTIRE inquiry insert to fail with
-- a constraint violation - unacceptable on a business-critical path
-- where saving the customer's inquiry must never depend on an analytics
-- nicety succeeding. Plain nullable identifiers instead; the column
-- type (uuid) still matches analytics_visitors.id / analytics_sessions.id
-- exactly, so a join is still trivial whenever both sides happen to agree.
alter table inquiries add column if not exists analytics_visitor_id uuid;
alter table inquiries add column if not exists analytics_session_id uuid;

create index if not exists inquiries_analytics_visitor_id_idx
  on inquiries (analytics_visitor_id) where analytics_visitor_id is not null;

-- Adds the "successful inquiry submission" conversion event, distinct
-- from the existing im_interested CTA click (which only means the form
-- was opened - see PuppyQuestionForm.tsx trackCta call on expand, vs.
-- the new recordAnalyticsEvent("inquiry_submit") call in
-- app/api/inquire/route.ts, fired only after a successful insert).
--
-- Confirmed against the live database (via a diagnostic insert, not a
-- guess) that this CHECK constraint's real name is
-- analytics_events_event_type_check - Postgres's default auto-generated
-- name for an unnamed inline CHECK defined in the original CREATE TABLE.
-- Dropping and recreating it with the added value is the same pattern
-- already used in supabase/017_sales_fulfillment_and_affiliate_fields.sql.
alter table analytics_events drop constraint if exists analytics_events_event_type_check;
alter table analytics_events add constraint analytics_events_event_type_check
  check (event_type in ('page_view', 'puppy_view', 'cta_click', 'inquiry_submit'));
