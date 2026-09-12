import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { SaleRow, PaymentRow } from "./saleTypes";
import { computeSaleProgress } from "./saleTypes";
import type { PuppyRow } from "./puppyTypes";

function saleRowFromQueryRow(row: any): SaleRow {
  return {
    id: row.id,
    puppy_id: row.puppy_id,
    contact_id: row.contact_id,
    sale_price_cents: row.sale_price_cents,
    status: row.status,
    fulfillment_method: row.fulfillment_method,
    fulfillment_status: row.fulfillment_status,
    scheduled_fulfillment_at: row.scheduled_fulfillment_at,
    fulfilled_at: row.fulfilled_at,
    fulfillment_notes: row.fulfillment_notes,
    paid_in_full_at: row.paid_in_full_at,
    closed_at: row.closed_at,
    closed_reason: row.closed_reason,
    affiliate_id: row.affiliate_id,
    affiliate_attribution_id: row.affiliate_attribution_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface SaleListItem {
  sale: SaleRow;
  puppyName: string;
  puppyId: string;
  breed: string;
  contactName: string;
  contactId: string;
  totalPaidCents: number;
  progress: ReturnType<typeof computeSaleProgress>;
}

export interface SaleDetail {
  sale: SaleRow;
  puppy: PuppyRow;
  contactName: string;
  contactId: string;
  payments: PaymentRow[];
  totalPaidCents: number;
  progress: ReturnType<typeof computeSaleProgress>;
  affiliateName: string | null;
  commission: { id: string; amountCents: number; status: string } | null;
}

export interface DashboardSalesSummary {
  todayRevenueCents: number;
  todayDepositsCents: number;
  todayPaymentsCents: number;
  recentSales: {
    saleId: string;
    puppyName: string;
    contactName: string;
    amountCents: number;
    progress: ReturnType<typeof computeSaleProgress>;
    date: string;
  }[];
}

export async function getSalesListData(): Promise<SaleListItem[]> {
  const admin = createAdminClient();

  const { data: salesData, error: salesError } = await admin
    .from("sales")
    .select("*, puppies(id, name, breed), contacts(id, first_name, last_name, display_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (salesError) throw new Error(salesError.message);

  const sales = salesData || [];
  const saleIds = sales.map((s: any) => s.id);

  let paymentsBySale = new Map<string, number>();
  if (saleIds.length > 0) {
    const { data: paymentsData, error: paymentsError } = await admin
      .from("payments")
      .select("sale_id, amount_cents")
      .in("sale_id", saleIds);

    if (paymentsError) throw new Error(paymentsError.message);

    for (const p of paymentsData || []) {
      paymentsBySale.set(p.sale_id, (paymentsBySale.get(p.sale_id) || 0) + p.amount_cents);
    }
  }

  return sales.map((row: any) => {
    const totalPaidCents = paymentsBySale.get(row.id) || 0;
    const contact = row.contacts;
    return {
      sale: saleRowFromQueryRow(row),
      puppyName: row.puppies?.name || "Unknown puppy",
      puppyId: row.puppy_id,
      breed: row.puppies?.breed || "",
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
      contactId: row.contact_id,
      totalPaidCents,
      progress: computeSaleProgress(totalPaidCents, row.sale_price_cents),
    };
  });
}

export async function getSaleById(id: string): Promise<SaleDetail | null> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("sales")
    .select("*, puppies(*), contacts(id, first_name, last_name, display_name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: payments, error: paymentsError } = await admin
    .from("payments")
    .select("*")
    .eq("sale_id", id)
    .order("paid_at", { ascending: false });

  if (paymentsError) throw new Error(paymentsError.message);

  const totalPaidCents = (payments || []).reduce((sum: number, p: any) => sum + p.amount_cents, 0);
  const contact = (row as any).contacts;

  let affiliateName: string | null = null;
  if (row.affiliate_id) {
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("first_name, last_name, display_name")
      .eq("id", row.affiliate_id)
      .maybeSingle();
    if (affiliate) {
      affiliateName = affiliate.display_name || `${affiliate.first_name} ${affiliate.last_name || ""}`.trim();
    }
  }

  const { data: commissionRow } = await admin
    .from("affiliate_commissions")
    .select("id, amount_cents, status")
    .eq("sale_id", id)
    .maybeSingle();

  return {
    sale: saleRowFromQueryRow(row),
    puppy: (row as any).puppies as PuppyRow,
    contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
    contactId: row.contact_id,
    payments: (payments || []) as PaymentRow[],
    totalPaidCents,
    progress: computeSaleProgress(totalPaidCents, row.sale_price_cents),
    affiliateName,
    commission: commissionRow
      ? { id: commissionRow.id, amountCents: commissionRow.amount_cents, status: commissionRow.status }
      : null,
  };
}

export async function getActiveSaleForPuppy(puppyId: string): Promise<SaleRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales")
    .select("*")
    .eq("puppy_id", puppyId)
    .eq("status", "active")
    .maybeSingle();

  if (error) return null;
  return (data as SaleRow) || null;
}

/** Real numbers only - used by the Dashboard now that this data exists. */
export async function getDashboardSalesSummary(): Promise<DashboardSalesSummary> {
  const admin = createAdminClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: paymentsData, error } = await admin
    .from("payments")
    .select("id, sale_id, amount_cents, payment_type, paid_at")
    .order("paid_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const payments = paymentsData || [];
  const todayPayments = payments.filter((p) => new Date(p.paid_at) >= startOfToday);

  const todayRevenueCents = todayPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const todayDepositsCents = todayPayments
    .filter((p) => p.payment_type === "deposit")
    .reduce((sum, p) => sum + p.amount_cents, 0);
  const todayPaymentsCents = todayPayments
    .filter((p) => p.payment_type !== "deposit")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const recentPayments = payments.slice(0, 10);
  const saleIds = Array.from(new Set(recentPayments.map((p) => p.sale_id)));

  let salesMap = new Map<string, any>();
  if (saleIds.length > 0) {
    const { data: salesData } = await admin
      .from("sales")
      .select("id, sale_price_cents, puppies(name), contacts(first_name, last_name, display_name)")
      .in("id", saleIds);
    for (const s of salesData || []) {
      salesMap.set((s as any).id, s);
    }
  }

  // Total paid per sale, for progress tags on the recent list.
  let totalsBySale = new Map<string, number>();
  if (saleIds.length > 0) {
    const { data: allPaymentsForSales } = await admin
      .from("payments")
      .select("sale_id, amount_cents")
      .in("sale_id", saleIds);
    for (const p of allPaymentsForSales || []) {
      totalsBySale.set(p.sale_id, (totalsBySale.get(p.sale_id) || 0) + p.amount_cents);
    }
  }

  const recentSales = recentPayments.map((p) => {
    const sale = salesMap.get(p.sale_id);
    const contact = sale?.contacts;
    const totalPaid = totalsBySale.get(p.sale_id) || 0;
    return {
      saleId: p.sale_id,
      puppyName: sale?.puppies?.name || "Unknown puppy",
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
      amountCents: p.amount_cents,
      progress: computeSaleProgress(totalPaid, sale?.sale_price_cents || 0),
      date: p.paid_at,
    };
  });

  return { todayRevenueCents, todayDepositsCents, todayPaymentsCents, recentSales };
}
