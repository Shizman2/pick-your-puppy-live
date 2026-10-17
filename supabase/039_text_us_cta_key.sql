-- Adds the 'text_us' CTA key (TEXT ABOUT {NAME} button on the puppy
-- detail page) to the analytics_events.cta_key check from migration 024.
-- Only the allowed-values list changes - no new columns; puppy_id and
-- path already identify which puppy and page a tap came from.
--
-- A tap is only a tap: it never means a text was actually sent.
--
-- Must be run manually in the Supabase SQL editor. Until it is, text_us
-- taps are rejected by the old check and simply not recorded (the
-- tracking endpoint is best-effort), so deploying the code first never
-- breaks the page.

alter table analytics_events drop constraint if exists analytics_events_cta_key_check;

alter table analytics_events
  add constraint analytics_events_cta_key_check
  check (cta_key in ('call_now', 'text_us', 'im_interested', 'puppy_finder', 'see_available_puppies'));
