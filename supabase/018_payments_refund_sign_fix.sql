-- Every total-paid computation in this app (computeSaleProgress,
-- getSalesListData, getDashboardSalesSummary) sums payments.amount_cents
-- with no special-casing by payment_type. That's only correct if a
-- refund is stored as a NEGATIVE amount - otherwise logging a refund
-- would silently inflate the total paid. Confirmed via a live read-only
-- check immediately before this migration: zero existing rows have
-- payment_type = 'refund', and zero existing rows have amount_cents <= 0,
-- so this constraint is safe to add now, before the Refund Sale
-- workflow (which is what will finally start using payment_type =
-- 'refund') ships.

alter table payments drop constraint if exists payments_amount_sign_matches_type_check;
alter table payments add constraint payments_amount_sign_matches_type_check
  check (
    (payment_type = 'refund' and amount_cents < 0)
    or
    (payment_type <> 'refund' and amount_cents > 0)
  );
