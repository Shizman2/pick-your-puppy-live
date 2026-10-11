-- Badge Tag becomes a purely optional marketing label, separate from Status.
--
-- puppies.badge_tag is plain text guarded by puppies_badge_tag_check, which
-- previously allowed 'available', 'new' and 'popular' (confirmed live).
-- 'available' duplicated Status, and 'price_drop' could not be saved.
--
-- Final allowed values: NULL (no badge), 'new', 'popular', 'price_drop'.
-- The three rows that held the legacy 'available' badge (Bubby, Mindy,
-- Pickle) were set to NULL before this was written, so no existing row
-- violates the new check. If one ever does, the transaction rolls back and
-- the old constraint stays in place.

begin;

alter table puppies drop constraint if exists puppies_badge_tag_check;

alter table puppies add constraint puppies_badge_tag_check
  check (badge_tag is null or badge_tag in ('new', 'popular', 'price_drop'));

commit;
