export type AffiliateStatus = "pending" | "approved" | "suspended" | "rejected";
export type AffiliateCommissionType = "flat_cents" | "percent_bp";
export type AffiliatePayoutMethod = "cash_app" | "zelle" | "venmo" | "paypal" | "check" | "other";

export type CommissionStatus = "pending" | "approved" | "in_payout" | "paid" | "void";
export type PayoutStatus = "pending" | "paid" | "void";

export type FulfillmentMethod = "pickup" | "delivery";
export type FulfillmentStatus = "pending" | "scheduled" | "completed";

export interface AffiliateRow {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  status: AffiliateStatus;
  referral_code: string;
  commission_type: AffiliateCommissionType;
  commission_flat_cents: number | null;
  commission_percent_bp: number | null;
  payout_method: AffiliatePayoutMethod | null;
  payout_handle: string | null;
  payout_notes: string | null;
  social_url: string | null;
  promotion_plan: string | null;
  application_notes: string | null;
  notes: string | null;
  applied_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommissionRow {
  id: string;
  sale_id: string;
  affiliate_id: string;
  amount_cents: number;
  status: CommissionStatus;
  hold_days_snapshot: number;
  eligible_at: string | null;
  approved_at: string | null;
  voided_at: string | null;
  voided_reason: string | null;
  flagged_after_close: boolean;
  flagged_reason: string | null;
  flagged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliatePayoutRow {
  id: string;
  affiliate_id: string;
  status: PayoutStatus;
  total_amount_cents: number;
  payout_method: string | null;
  payout_reference: string | null;
  created_at: string;
  paid_at: string | null;
  voided_at: string | null;
  voided_reason: string | null;
}

export interface AffiliateProgramSettingsRow {
  commission_hold_days: number;
  attribution_window_days: number;
  default_commission_type: AffiliateCommissionType;
  default_commission_value: number;
}

export const AFFILIATE_STATUS_LABEL: Record<AffiliateStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  suspended: "Suspended",
  rejected: "Rejected",
};

export const COMMISSION_STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  in_payout: "In Payout",
  paid: "Paid",
  void: "Void",
};

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  void: "Void",
};

export const PAYOUT_METHOD_OPTIONS: AffiliatePayoutMethod[] = [
  "cash_app",
  "zelle",
  "venmo",
  "paypal",
  "check",
  "other",
];

export const PAYOUT_METHOD_LABEL: Record<AffiliatePayoutMethod, string> = {
  cash_app: "Cash App",
  zelle: "Zelle",
  venmo: "Venmo",
  paypal: "PayPal",
  check: "Check",
  other: "Other",
};

export const FULFILLMENT_METHOD_OPTIONS: FulfillmentMethod[] = ["pickup", "delivery"];
export const FULFILLMENT_STATUS_OPTIONS: FulfillmentStatus[] = ["pending", "scheduled", "completed"];

export function affiliateDisplayName(a: { first_name: string; last_name: string | null; display_name: string | null }): string {
  return a.display_name || `${a.first_name} ${a.last_name || ""}`.trim();
}

/** amount_cents owed on a sale for a given affiliate's current commission settings. */
export function computeCommissionAmountCents(
  affiliate: { commission_type: AffiliateCommissionType; commission_flat_cents: number | null; commission_percent_bp: number | null },
  salePriceCents: number
): number {
  if (affiliate.commission_type === "flat_cents") {
    return affiliate.commission_flat_cents || 0;
  }
  const bp = affiliate.commission_percent_bp || 0;
  return Math.round((salePriceCents * bp) / 10000);
}
