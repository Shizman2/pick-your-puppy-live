import "server-only";
import { createAdminClient } from "./supabase/admin";
import { getAffiliateProgramSettings } from "./affiliateSettings";

export const AFFILIATE_CLICK_COOKIE = "ppl_aff";

/**
 * Records a click against a referral code, if that code currently
 * belongs to an approved affiliate. A suspended/pending/rejected
 * affiliate's code is simply inert - no row is recorded, so their link
 * behaves like a dead link and doesn't pollute their own stats either.
 *
 * window_days_snapshot/expires_at are computed ONCE here, from the
 * program setting in effect right now - later changes to
 * attribution_window_days never reach back and stretch this click.
 */
export async function recordAffiliateClick(
  referralCode: string,
  landingPath: string | null
): Promise<{ clickId: string; expiresAt: string } | null> {
  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id, status")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!affiliate || affiliate.status !== "approved") return null;

  const settings = await getAffiliateProgramSettings();
  const clickedAt = new Date();
  const expiresAt = new Date(clickedAt.getTime() + settings.attribution_window_days * 24 * 60 * 60 * 1000);

  const { data: click, error } = await admin
    .from("affiliate_clicks")
    .insert({
      affiliate_id: affiliate.id,
      referral_code: referralCode,
      landing_path: landingPath,
      clicked_at: clickedAt.toISOString(),
      window_days_snapshot: settings.attribution_window_days,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, expires_at")
    .single();

  if (error || !click) return null;
  return { clickId: click.id, expiresAt: click.expires_at };
}

/**
 * Attaches a previously-recorded click to a Contact once that visitor
 * submits a form. Re-validates the click is still within its own
 * window AND that the affiliate is STILL approved right now (not just
 * at click time) - a since-suspended affiliate never gains new
 * attribution, even from an old still-valid-looking click.
 *
 * Idempotent: the same contact + click can only ever produce one ledger
 * row (unique index), so repeat form submissions on the same cookie are
 * free no-ops, never row bloat.
 */
export async function attachClickAttributionToContact(contactId: string, clickId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: click } = await admin
    .from("affiliate_clicks")
    .select("id, affiliate_id, referral_code, expires_at, affiliates(status)")
    .eq("id", clickId)
    .maybeSingle();

  if (!click) return;
  if (new Date(click.expires_at) < new Date()) return;

  const affiliateStatus = (click as unknown as { affiliates: { status: string } | null }).affiliates?.status;
  if (affiliateStatus !== "approved") return;

  await admin
    .from("contact_affiliate_attributions")
    .upsert(
      {
        contact_id: contactId,
        affiliate_id: click.affiliate_id,
        source: "click",
        click_id: click.id,
        referral_code: click.referral_code,
        expires_at: click.expires_at,
      },
      { onConflict: "contact_id,click_id", ignoreDuplicates: true }
    );
}

export interface ResolvedAttribution {
  affiliateId: string;
  attributionId: string;
}

/**
 * "Who owns this Contact right now" - the most recent ledger row that
 * is both still within its own window AND whose affiliate is currently
 * approved. Falls through past a row that fails either check (e.g. a
 * since-suspended affiliate's otherwise-current row) to an earlier,
 * still-valid row if one exists, rather than just giving up.
 */
export async function resolveCurrentAttributionForContact(
  contactId: string,
  atTime: Date = new Date()
): Promise<ResolvedAttribution | null> {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("contact_affiliate_attributions")
    .select("id, affiliate_id, expires_at, affiliates(status)")
    .eq("contact_id", contactId)
    .order("attributed_at", { ascending: false })
    .limit(20);

  for (const row of rows || []) {
    const expiresAt = new Date((row as { expires_at: string }).expires_at);
    const affiliateStatus = (row as unknown as { affiliates: { status: string } | null }).affiliates?.status;
    if (expiresAt >= atTime && affiliateStatus === "approved") {
      return { affiliateId: (row as { affiliate_id: string }).affiliate_id, attributionId: (row as { id: string }).id };
    }
  }
  return null;
}
