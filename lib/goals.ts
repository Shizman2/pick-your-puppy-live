import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { SalesGoalRow, GoalProgress } from "./goalTypes";
import { getPeriodFinancials } from "./businessScorecard";

export async function getActiveGoal(): Promise<SalesGoalRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_goals")
    .select("*")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as SalesGoalRow) || null;
}

/**
 * A puppy counts toward the goal on the date it became sold
 * (puppies.sold_at) - inventory status is the source of truth for
 * "when did this sell", deliberately independent of payments/revenue.
 * A puppy marked sold today counts today even if it's not paid off
 * yet; a puppy that's fully paid but never marked sold does not count
 * until its status is updated. This is real, derived data - never a
 * fabricated or manually-entered count.
 *
 * Every figure here is recomputed fresh from the goal's saved target
 * and date range - editing the goal (see updateGoal/startNewGoal in
 * app/admin/dashboard/actions.ts) changes what gets calculated without
 * any code change.
 */
export async function getGoalProgress(goal: SalesGoalRow): Promise<GoalProgress> {
  const admin = createAdminClient();
  const startDate = new Date(`${goal.start_date}T00:00:00`);
  // end_date is authoritative when the goal has one; only a goal saved
  // before this field existed falls back to the old duration-based math.
  const endDate = goal.end_date
    ? new Date(`${goal.end_date}T23:59:59`)
    : new Date(startDate.getTime() + goal.duration_weeks * 7 * 86400000);
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);

  const { data: soldPuppies } = await admin
    .from("puppies")
    .select("id, sold_at")
    .eq("status", "sold")
    .not("sold_at", "is", null)
    .gte("sold_at", startDate.toISOString())
    .lte("sold_at", endDate.toISOString());

  let soldInPeriod = 0;
  let soldThisWeek = 0;
  for (const p of soldPuppies || []) {
    soldInPeriod += 1;
    if (new Date(p.sold_at as string) >= oneWeekAgo) soldThisWeek += 1;
  }

  const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);
  const daysElapsed = Math.min(totalDays, Math.max(0, (now.getTime() - startDate.getTime()) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));

  const remaining = Math.max(0, goal.target_count - soldInPeriod);
  const weeksRemaining = Math.max(daysLeft / 7, 1 / 7); // never divide by zero on the final day
  const weeklyPaceNeeded = daysLeft > 0 ? Math.round((remaining / weeksRemaining) * 10) / 10 : 0;

  const expectedByNow = goal.target_count * (daysElapsed / totalDays);
  const onPace = soldInPeriod >= expectedByNow * 0.9;

  const percentComplete = goal.target_count > 0 ? Math.min(100, Math.round((soldInPeriod / goal.target_count) * 100)) : 0;

  const financials = await getPeriodFinancials(startDate, endDate);

  const revenuePercentComplete =
    goal.revenue_goal_cents && goal.revenue_goal_cents > 0
      ? Math.min(100, Math.round((financials.revenueCents / goal.revenue_goal_cents) * 100))
      : null;
  const profitPercentComplete =
    goal.profit_goal_cents && goal.profit_goal_cents > 0
      ? Math.min(100, Math.round((financials.grossProfitCents / goal.profit_goal_cents) * 100))
      : null;

  // Average Sale/Profit are computed from financials' OWN qualifying-sale
  // totals (sale_price_cents sum, Gross Profit), never from revenueCents
  // (cash collected) or from this function's separately-queried
  // soldInPeriod - per the Job 2 Financial Correction, Average Sale uses
  // completed-sale economics, not payments received, and both numerator
  // and denominator here come from the same transaction set.
  const avgSaleCents =
    financials.puppiesSold > 0 ? Math.round(financials.totalSalePriceCents / financials.puppiesSold) : 0;
  const avgProfitPerPuppyCents =
    financials.puppiesSold > 0 ? Math.round(financials.grossProfitCents / financials.puppiesSold) : 0;

  return {
    goal,
    soldInPeriod,
    soldThisWeek,
    daysLeft,
    weeklyPaceNeeded,
    onPace,
    percentComplete,
    revenueCents: financials.revenueCents,
    profitCents: financials.grossProfitCents,
    revenuePercentComplete,
    profitPercentComplete,
    avgSaleCents,
    avgProfitPerPuppyCents,
  };
}
