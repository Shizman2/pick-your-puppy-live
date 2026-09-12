import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { AffiliateRow } from "./affiliateTypes";

export async function getAffiliatesListData(): Promise<AffiliateRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("affiliates").select("*").order("applied_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as AffiliateRow[];
}

export async function getAffiliateById(id: string): Promise<AffiliateRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("affiliates").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AffiliateRow) || null;
}

export interface AffiliateCommissionListItem {
  id: string;
  saleId: string;
  amountCents: number;
  status: string;
  eligibleAt: string | null;
  createdAt: string;
  flaggedAfterClose: boolean;
  puppyName: string;
  contactName: string;
}

export async function getCommissionsForAffiliate(affiliateId: string): Promise<AffiliateCommissionListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("affiliate_commissions")
    .select("id, sale_id, amount_cents, status, eligible_at, created_at, flagged_after_close, sales(puppy_id, contact_id, puppies(name), contacts(first_name, last_name, display_name))")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => {
    const sale = row.sales;
    const contact = sale?.contacts;
    return {
      id: row.id,
      saleId: row.sale_id,
      amountCents: row.amount_cents,
      status: row.status,
      eligibleAt: row.eligible_at,
      createdAt: row.created_at,
      flaggedAfterClose: row.flagged_after_close,
      puppyName: sale?.puppies?.name || "Unknown puppy",
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
    };
  });
}

export async function getAllCommissionsListData(): Promise<(AffiliateCommissionListItem & { affiliateName: string; affiliateId: string })[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("affiliate_commissions")
    .select(
      "id, sale_id, amount_cents, status, eligible_at, created_at, flagged_after_close, affiliate_id, affiliates(first_name, last_name, display_name), sales(puppy_id, contact_id, puppies(name), contacts(first_name, last_name, display_name))"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => {
    const sale = row.sales;
    const contact = sale?.contacts;
    const affiliate = row.affiliates;
    return {
      id: row.id,
      saleId: row.sale_id,
      amountCents: row.amount_cents,
      status: row.status,
      eligibleAt: row.eligible_at,
      createdAt: row.created_at,
      flaggedAfterClose: row.flagged_after_close,
      puppyName: sale?.puppies?.name || "Unknown puppy",
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
      affiliateId: row.affiliate_id,
      affiliateName: affiliate?.display_name || `${affiliate?.first_name ?? ""} ${affiliate?.last_name ?? ""}`.trim() || "Unknown",
    };
  });
}

export interface AffiliatePayoutListItem {
  id: string;
  affiliateId: string;
  affiliateName: string;
  status: string;
  totalAmountCents: number;
  createdAt: string;
  paidAt: string | null;
}

export async function getPayoutsListData(): Promise<AffiliatePayoutListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("affiliate_payouts")
    .select("id, affiliate_id, status, total_amount_cents, created_at, paid_at, affiliates(first_name, last_name, display_name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    affiliateId: row.affiliate_id,
    affiliateName:
      row.affiliates?.display_name || `${row.affiliates?.first_name ?? ""} ${row.affiliates?.last_name ?? ""}`.trim() || "Unknown",
    status: row.status,
    totalAmountCents: row.total_amount_cents,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }));
}

export interface AffiliatePayoutDetail {
  id: string;
  affiliateId: string;
  affiliateName: string;
  status: string;
  totalAmountCents: number;
  payoutMethod: string | null;
  payoutReference: string | null;
  createdAt: string;
  paidAt: string | null;
  voidedAt: string | null;
  voidedReason: string | null;
  commissions: { id: string; amountCents: number; puppyName: string; contactName: string }[];
}

export async function getPayoutById(id: string): Promise<AffiliatePayoutDetail | null> {
  const admin = createAdminClient();
  const { data: payout, error } = await admin
    .from("affiliate_payouts")
    .select("*, affiliates(first_name, last_name, display_name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!payout) return null;

  const { data: junctionRows } = await admin
    .from("affiliate_payout_commissions")
    .select("commission_id, affiliate_commissions(id, amount_cents, sales(puppies(name), contacts(first_name, last_name, display_name)))")
    .eq("payout_id", id)
    .eq("is_active", true);

  const commissions = (junctionRows || []).map((row: any) => {
    const commission = row.affiliate_commissions;
    const sale = commission?.sales;
    const contact = sale?.contacts;
    return {
      id: commission?.id,
      amountCents: commission?.amount_cents || 0,
      puppyName: sale?.puppies?.name || "Unknown puppy",
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
    };
  });

  const affiliate = (payout as any).affiliates;
  return {
    id: payout.id,
    affiliateId: payout.affiliate_id,
    affiliateName: affiliate?.display_name || `${affiliate?.first_name ?? ""} ${affiliate?.last_name ?? ""}`.trim() || "Unknown",
    status: payout.status,
    totalAmountCents: payout.total_amount_cents,
    payoutMethod: payout.payout_method,
    payoutReference: payout.payout_reference,
    createdAt: payout.created_at,
    paidAt: payout.paid_at,
    voidedAt: payout.voided_at,
    voidedReason: payout.voided_reason,
    commissions,
  };
}

export interface ApprovedCommissionOption {
  id: string;
  amountCents: number;
  puppyName: string;
  contactName: string;
}

export async function getApprovedCommissionsForAffiliate(affiliateId: string): Promise<ApprovedCommissionOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("affiliate_commissions")
    .select("id, amount_cents, sales(puppies(name), contacts(first_name, last_name, display_name))")
    .eq("affiliate_id", affiliateId)
    .eq("status", "approved");

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => {
    const sale = row.sales;
    const contact = sale?.contacts;
    return {
      id: row.id,
      amountCents: row.amount_cents,
      puppyName: sale?.puppies?.name || "Unknown puppy",
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
    };
  });
}

export interface AffiliatePortalStats {
  totalClicks: number;
  referredContacts: number;
  totalSales: number;
  conversionRate: number; // sales / referred contacts, 0 if no contacts
  commissionTotalsCents: Record<string, number>;
}

/**
 * Deliberately simple aggregate queries, no rollup table - see
 * blueprint section 12: at this business's expected volume, a nightly
 * rollup table would be solving a scale problem this program doesn't
 * have yet.
 */
export async function getAffiliatePortalStats(affiliateId: string): Promise<AffiliatePortalStats> {
  const admin = createAdminClient();

  const [{ count: totalClicks }, { data: attributions }, { count: totalSales }, { data: commissions }] = await Promise.all([
    admin.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId),
    admin.from("contact_affiliate_attributions").select("contact_id").eq("affiliate_id", affiliateId),
    admin.from("sales").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId),
    admin.from("affiliate_commissions").select("amount_cents, status").eq("affiliate_id", affiliateId),
  ]);

  const referredContacts = new Set((attributions || []).map((a) => a.contact_id)).size;

  const commissionTotalsCents: Record<string, number> = {};
  for (const c of commissions || []) {
    commissionTotalsCents[c.status] = (commissionTotalsCents[c.status] || 0) + c.amount_cents;
  }

  return {
    totalClicks: totalClicks || 0,
    referredContacts,
    totalSales: totalSales || 0,
    conversionRate: referredContacts > 0 ? (totalSales || 0) / referredContacts : 0,
    commissionTotalsCents,
  };
}

/** Short, URL-safe, collision-checked referral code. */
export async function generateUniqueReferralCode(seed: string): Promise<string> {
  const admin = createAdminClient();
  const base = seed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "PUP";

  for (let attempt = 0; attempt < 25; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = attempt === 0 ? base : `${base}${suffix}`;
    const { data } = await admin.from("affiliates").select("id").eq("referral_code", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `AFF${Date.now().toString(36).toUpperCase()}`;
}
