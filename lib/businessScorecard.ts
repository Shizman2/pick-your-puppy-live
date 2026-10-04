import "server-only";
import { createAdminClient } from "./supabase/admin";
import {
  computeComparison,
  countNewContacts,
  countLandingVisitors,
  getFunnelDataForRange,
  type MetricComparison,
} from "./analytics/queries";
import { getAdSpendTotal } from "./adSpend";
import type { SalesGoalRow } from "./goalTypes";

export interface PeriodFinancials {
  /** Cash actually received in [start, end) - payments.paid_at. Intentionally independent of Gross Profit below - see the doc comment there. */
  revenueCents: number;
  depositsCents: number;
  otherPaymentsCents: number;
  /** Transaction-based: sum of (sale_price - puppy cost - bundle cost - delivery cost - other cost) for each qualifying sold transaction. Never derived from payments. */
  grossProfitCents: number;
  /** Sum of sale_price_cents for qualifying sold transactions - the numerator for Average Sale (lib/goals.ts). */
  totalSalePriceCents: number;
  /** Count of qualifying sold transactions - same anchor (puppies.sold_at) as Puppies Sold everywhere else in the app. */
  puppiesSold: number;
}

interface QualifyingSale {
  salePriceCents: number;
  costCents: number;
}

/**
 * The set of "qualifying sold transactions" for [start, end): one sale
 * per puppy whose puppies.sold_at falls in the period, per the locked-in
 * period-anchor decision (Job 2 Financial Correction) - puppies.sold_at
 * is authoritative for which reporting period a sale belongs to, never
 * payments.paid_at or sales.created_at.
 *
 * A puppy can in principle have more than one sales row (an earlier
 * cancelled attempt, then a real sale) - cancelled sales are excluded
 * entirely; if both an active and a refunded row somehow exist for the
 * same puppy, the active one wins (a refund doesn't revert
 * puppies.status/sold_at - see cancelSale's own comment in
 * app/admin/sales/actions.ts - so the puppy can still correctly show as
 * sold even though its completing sale was later refunded).
 */
async function getQualifyingSales(start: Date, end: Date): Promise<QualifyingSale[]> {
  const admin = createAdminClient();

  const { data: soldPuppies } = await admin
    .from("puppies")
    .select("id, cost_cents, bundle_cost_cents")
    .eq("status", "sold")
    .not("sold_at", "is", null)
    .gte("sold_at", start.toISOString())
    .lt("sold_at", end.toISOString());

  const puppies = soldPuppies || [];
  if (puppies.length === 0) return [];

  const puppyIds = puppies.map((p: any) => p.id);
  let { data: salesData, error: salesError } = await admin
    .from("sales")
    .select("puppy_id, sale_price_cents, delivery_cost_cents, other_cost_cents, status, created_at")
    .in("puppy_id", puppyIds)
    .in("status", ["active", "refunded"]);

  // Defensive compatibility: delivery_cost_cents/other_cost_cents only
  // exist once supabase/032_sale_costs_and_ad_campaign.sql has actually
  // been run (deliberately NOT run automatically - see that migration
  // file). Until then this select fails - confirmed live against the
  // real database that a SELECT of an unknown column returns Postgres's
  // own "42703" (undefined_column), NOT "PGRST204" (that code is what an
  // INSERT/UPDATE with an unrecognized payload key returns instead - see
  // app/api/inquire/route.ts and app/admin/analytics/adSpendActions.ts -
  // PostgREST validates insert/update payload keys against its own
  // cached schema before ever reaching Postgres, but appears to forward
  // an unknown SELECT column straight through). Checking both codes
  // keeps Puppies Sold/Gross Profit/Average Sale working (just without
  // delivery/other cost deducted yet) regardless of migration timing,
  // rather than silently collapsing every qualifying sale to zero.
  if (salesError?.code === "PGRST204" || salesError?.code === "42703") {
    const retry = await admin
      .from("sales")
      .select("puppy_id, sale_price_cents, status, created_at")
      .in("puppy_id", puppyIds)
      .in("status", ["active", "refunded"]);
    salesData = (retry.data || []).map((s: any) => ({ ...s, delivery_cost_cents: 0, other_cost_cents: 0 }));
    salesError = retry.error;
  }

  const saleByPuppy = new Map<string, any>();
  for (const s of salesData || []) {
    const existing = saleByPuppy.get(s.puppy_id);
    if (!existing) {
      saleByPuppy.set(s.puppy_id, s);
    } else if (existing.status !== "active" && s.status === "active") {
      saleByPuppy.set(s.puppy_id, s);
    } else if (existing.status === s.status && new Date(s.created_at) > new Date(existing.created_at)) {
      saleByPuppy.set(s.puppy_id, s);
    }
  }

  const puppyById = new Map(puppies.map((p: any) => [p.id, p]));

  const result: QualifyingSale[] = [];
  for (const [puppyId, sale] of saleByPuppy.entries()) {
    const puppy = puppyById.get(puppyId);
    if (!puppy) continue;
    const costCents =
      (puppy.cost_cents || 0) + (puppy.bundle_cost_cents || 0) + (sale.delivery_cost_cents || 0) + (sale.other_cost_cents || 0);
    result.push({ salePriceCents: sale.sale_price_cents, costCents });
  }

  return result;
}

/**
 * Revenue = payments actually collected in [start, end) (payments.paid_at)
 * - the same "money that came in" definition the Dashboard's Revenue
 * Today card already used (lib/sales.ts getDashboardSalesSummary).
 *
 * Gross Profit is deliberately NOT "revenue minus costs" - it is
 * transaction-based: for every qualifying sold transaction (puppy.sold_at
 * in this period), profit = sale_price_cents - puppy cost_cents -
 * puppy bundle_cost_cents - sale delivery_cost_cents - sale
 * other_cost_cents, summed across qualifying transactions. A partially
 * paid sale still contributes its FULL completed-sale economics to
 * Gross Profit even though Revenue (cash collected) is lower - these are
 * intentionally different measurements, per the Job 2 Financial
 * Correction. Missing optional costs (delivery/other, both default 0)
 * simply don't subtract anything.
 */
export async function getPeriodFinancials(start: Date, end: Date): Promise<PeriodFinancials> {
  const admin = createAdminClient();

  const [{ data: paymentsData }, qualifyingSales] = await Promise.all([
    admin
      .from("payments")
      .select("amount_cents, payment_type")
      .gte("paid_at", start.toISOString())
      .lt("paid_at", end.toISOString()),
    getQualifyingSales(start, end),
  ]);

  const payments = paymentsData || [];
  const revenueCents = payments.reduce((sum: number, p: any) => sum + p.amount_cents, 0);
  const depositsCents = payments
    .filter((p: any) => p.payment_type === "deposit")
    .reduce((sum: number, p: any) => sum + p.amount_cents, 0);
  const otherPaymentsCents = revenueCents - depositsCents;

  const totalSalePriceCents = qualifyingSales.reduce((sum, s) => sum + s.salePriceCents, 0);
  const totalCostCents = qualifyingSales.reduce((sum, s) => sum + s.costCents, 0);

  return {
    revenueCents,
    depositsCents,
    otherPaymentsCents,
    grossProfitCents: totalSalePriceCents - totalCostCents,
    totalSalePriceCents,
    puppiesSold: qualifyingSales.length,
  };
}

export interface ScorecardMetrics {
  puppiesSold: MetricComparison;
  revenueCents: MetricComparison;
  grossProfitCents: MetricComparison;
  leads: MetricComparison;
  adSpendCents: MetricComparison;
}

/**
 * The 5 top metric cards on the Business Scorecard, each compared against
 * the immediately preceding period of equal length (same pattern as the
 * Analytics page's own getTopMetrics - see lib/analytics/queries.ts).
 */
export async function getScorecardMetrics(start: Date, end: Date): Promise<ScorecardMetrics> {
  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  const [current, previous, leadsNow, leadsPrev, adSpendNow, adSpendPrev] = await Promise.all([
    getPeriodFinancials(start, end),
    getPeriodFinancials(prevStart, prevEnd),
    countNewContacts(start, end),
    countNewContacts(prevStart, prevEnd),
    getAdSpendTotal(start, end),
    getAdSpendTotal(prevStart, prevEnd),
  ]);

  return {
    puppiesSold: computeComparison(current.puppiesSold, previous.puppiesSold),
    revenueCents: computeComparison(current.revenueCents, previous.revenueCents),
    grossProfitCents: computeComparison(current.grossProfitCents, previous.grossProfitCents),
    leads: computeComparison(leadsNow, leadsPrev),
    adSpendCents: computeComparison(adSpendNow, adSpendPrev),
  };
}

export interface MarketingPerformance {
  funnel: { landingVisitors: number; puppyViewers: number; leads: number; sales: number };
  /** null = can't be computed meaningfully (the denominator is zero) - shown as "-" rather than a misleading 0 or Infinity. */
  costPerLeadCents: number | null;
  costPerSaleCents: number | null;
  roas: number | null;
  leadToSaleRate: number | null;
  /** Gross Profit - Ad Spend. Deliberately NOT called "Net Profit" - other real costs (staff time, overhead, etc.) aren't tracked, so "net" would overclaim precision this app doesn't have. */
  profitAfterAdsCents: number;
}

/**
 * The funnel here ends in "Sales" (puppies sold in the period), unlike the
 * Analytics page's own funnel which ends in "Inquiries" - this is the
 * Business Scorecard's marketing-ROI view, not the Analytics page's
 * conversion-tracking view. Reuses getFunnelDataForRange for
 * puppyViewers/leads rather than re-querying the same visitor/session
 * data, but NOT for the first step: per the Pre-Launch Tracking Fix,
 * "Landing Visitors" means real unique visitors to the GHL /start page
 * (pickyourpuppylive.com) - countLandingVisitors, reading the separate
 * landing_visitors table - never generic thepuppyplugs.com sessions
 * (which is what getFunnelDataForRange's own "landingVisitors" field
 * actually measures; see that field's doc comment and the renamed label
 * on the Analytics page's own FunnelCard, which uses it correctly).
 */
export async function getMarketingPerformance(start: Date, end: Date): Promise<MarketingPerformance> {
  const [funnelBase, financials, adSpendCents, landingVisitors] = await Promise.all([
    getFunnelDataForRange(start, end),
    getPeriodFinancials(start, end),
    getAdSpendTotal(start, end),
    countLandingVisitors(start, end),
  ]);

  const funnel = {
    landingVisitors,
    puppyViewers: funnelBase.puppyViewers,
    leads: funnelBase.leads,
    sales: financials.puppiesSold,
  };

  const costPerLeadCents = funnel.leads > 0 ? Math.round(adSpendCents / funnel.leads) : null;
  const costPerSaleCents = funnel.sales > 0 ? Math.round(adSpendCents / funnel.sales) : null;
  const roas = adSpendCents > 0 ? financials.revenueCents / adSpendCents : null;
  const leadToSaleRate = funnel.leads > 0 ? (funnel.sales / funnel.leads) * 100 : null;
  const profitAfterAdsCents = financials.grossProfitCents - adSpendCents;

  return { funnel, costPerLeadCents, costPerSaleCents, roas, leadToSaleRate, profitAfterAdsCents };
}

export type DashboardPeriodKey = "goal" | "7d" | "30d" | "90d";

export interface ResolvedDashboardPeriod {
  start: Date;
  end: Date;
  label: string;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * "Active Goal Period" is the default because the goal already defines the
 * business-meaningful window (e.g. "Q4 Goal: Oct 3 - Dec 31") - the other
 * options are plain rolling windows for when there's no active goal, or
 * when a quick recent-trend check is more useful than the full goal span.
 */
export function resolveDashboardPeriod(key: DashboardPeriodKey, activeGoal: SalesGoalRow | null): ResolvedDashboardPeriod {
  const now = new Date();

  if (key === "goal" && activeGoal) {
    const start = new Date(`${activeGoal.start_date}T00:00:00`);
    const end = activeGoal.end_date ? new Date(`${activeGoal.end_date}T23:59:59`) : now;
    return { start, end, label: `${formatShortDate(start)} – ${formatShortDate(end)}` };
  }

  const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
  const start = new Date(now.getTime() - days * 86400000);
  return { start, end: now, label: `Last ${days} Days` };
}
