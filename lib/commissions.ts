import "server-only";
import { createAdminClient } from "./supabase/admin";
import { getAffiliateProgramSettings } from "./affiliateSettings";
import { computeCommissionAmountCents } from "./affiliateTypes";

/**
 * Creates the commission for a newly-created Sale that has an affiliate
 * attribution snapshot, if one doesn't already exist. Safe to call more
 * than once for the same sale - ignoreDuplicates against the unique
 * sale_id constraint makes a repeat call a no-op rather than a second
 * $X commission (see blueprint item 14: this is the DB-level guarantee,
 * this call is just the idempotent app-side wrapper around it).
 */
export async function createCommissionForSaleIfAttributed(saleId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: sale } = await admin
    .from("sales")
    .select("id, affiliate_id, sale_price_cents")
    .eq("id", saleId)
    .maybeSingle();

  if (!sale || !sale.affiliate_id) return;

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("commission_type, commission_flat_cents, commission_percent_bp")
    .eq("id", sale.affiliate_id)
    .maybeSingle();

  if (!affiliate) return;

  const amountCents = computeCommissionAmountCents(affiliate, sale.sale_price_cents);
  if (amountCents <= 0) return;

  const settings = await getAffiliateProgramSettings();

  await admin.from("affiliate_commissions").upsert(
    {
      sale_id: saleId,
      affiliate_id: sale.affiliate_id,
      amount_cents: amountCents,
      hold_days_snapshot: settings.commission_hold_days,
    },
    { onConflict: "sale_id", ignoreDuplicates: true }
  );
}
