-- Puppy statuses: adds 'sale_pending'.
--
--   available     listed, can be pursued
--   hold          temporarily held for a customer (shown as "On Hold")
--   sale_pending  a customer has committed to buy; payment, pickup or
--                 delivery not finished yet (shown as "Sale Pending")
--   sold          sold
--   on_sale, discounted   pricing presentation, still purchasable
--
-- No puppy rows are changed. The puppies table predates the migrations in
-- this repo, so this first removes any existing CHECK constraint that
-- restricts puppies.status (whatever it's named, if one exists) and then
-- adds one named constraint listing every status the app uses.
--
-- Must be run manually in the Supabase SQL editor. Until it is, the admin
-- form's new "Sale Pending" option may be rejected if the database had an
-- older status rule; every other status keeps working.

do $$
declare
  v_name text;
begin
  for v_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'puppies'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.puppies drop constraint %I', v_name);
  end loop;
end;
$$;

alter table public.puppies
  add constraint puppies_status_check
  check (status in ('available', 'hold', 'sale_pending', 'sold', 'on_sale', 'discounted'));
