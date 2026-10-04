-- Extends the existing sales_goals table (goal system already live,
-- see lib/goals.ts / app/admin/dashboard/actions.ts) with a display
-- name and an explicit end date, so admins can edit a goal directly
-- by date range instead of only a duration-in-weeks count.
--
-- duration_weeks is left in place (not dropped/renamed) for backward
-- compatibility with any existing rows; new saves keep writing a
-- derived value to it, but it's no longer what drives the dashboard's
-- calculations - end_date is now authoritative when present, with the
-- old start_date + duration_weeks math kept as a fallback for any
-- historical row saved before this migration (end_date null).
--
-- Purely additive and safe to run against the existing (populated)
-- sales_goals table - the current active goal just gets name = null
-- and end_date = null until edited through the new Admin UI.
alter table sales_goals add column if not exists name text;
alter table sales_goals add column if not exists end_date date;
