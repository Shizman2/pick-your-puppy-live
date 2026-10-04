-- Admin push notification for new unique GHL funnel visitors.
--
-- Same pattern as supabase/008_puppy_finder_proposals.sql adding
-- notify_puppy_finder_selections - a single new on/off column on the
-- existing admin_notification_preferences table (supabase/005_push_notifications.sql),
-- controlling ONLY this one new event type. Defaults to true, matching
-- every existing preference column - no strong reason to default it off.
alter table admin_notification_preferences
  add column if not exists notify_funnel_visitors boolean not null default true;
