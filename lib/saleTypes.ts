export type PaymentMethod = "cash_app" | "zelle" | "venmo" | "cash" | "card" | "check" | "other";
export type PaymentType = "deposit" | "balance" | "full" | "refund" | "other";
export type SaleStatus = "active" | "cancelled" | "refunded";

export interface SaleRow {
  id: string;
  puppy_id: string;
  contact_id: string;
  sale_price_cents: number;
  status: SaleStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  sale_id: string;
  amount_cents: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  note: string | null;
  paid_at: string;
  created_at: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  "cash_app",
  "zelle",
  "venmo",
  "cash",
  "card",
  "check",
  "other",
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash_app: "Cash App",
  zelle: "Zelle",
  venmo: "Venmo",
  cash: "Cash",
  card: "Card",
  check: "Check",
  other: "Other",
};

export const PAYMENT_TYPE_OPTIONS: PaymentType[] = ["deposit", "balance", "full", "refund", "other"];

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  deposit: "Deposit",
  balance: "Balance",
  full: "Full payment",
  refund: "Refund",
  other: "Other",
};

/** Computed, not stored - derived live from payments vs sale_price_cents. */
export type SaleProgress = "pending" | "partial" | "paid_in_full";

export function computeSaleProgress(totalPaidCents: number, salePriceCents: number): SaleProgress {
  if (totalPaidCents >= salePriceCents && salePriceCents > 0) return "paid_in_full";
  if (totalPaidCents > 0) return "partial";
  return "pending";
}

export const SALE_PROGRESS_LABEL: Record<SaleProgress, string> = {
  pending: "No payment yet",
  partial: "Balance due",
  paid_in_full: "Paid in full",
};
