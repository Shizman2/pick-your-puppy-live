import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { SalesGoalRow, GoalProgress } from "./goalTypes";

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
 * A sale counts toward the goal on the date its total payments first
 * reached the full sale price. Approximated using the most recent
 * payment's date for each fully-paid sale - accurate for the common
 * case where the final payment is what completes the sale. This is
 * real, derived data - never a fabricated or manually-entered count.
 */
export async function getGoalProgress(goal: SalesGoalRow): Promise<GoalProgress> {
  const admin = createAdminClient();
  const startDate = new Date(goal.start_date);
  const endDate = new Date(startDate.getTime() + goal.duration_weeks * 7 * 86400000);
  const now = new Date();

  const { data: sales } = await admin.from("sales").select("id, sale_price_cents").eq("status", "active");
  const saleIds = (sales || []).map((s) => s.id);
  const priceById = new Map((sales || []).map((s) => [s.id, s.sale_price_cents]));

  let soldInPeriod = 0;
  let soldThisWeek = 0;
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);

  if (saleIds.length > 0) {
    const { data: payments } = await admin
      .from("payments")
      .select("sale_id, amount_cents, paid_at")
      .in("sale_id", saleIds)
      .order("paid_at", { ascending: true });

    const bySale = new Map<string, { total: number; lastPaidAt: string }>();
    for (const p of payments || []) {
      const entry = bySale.get(p.sale_id) || { total: 0, lastPaidAt: p.paid_at };
      entry.total += p.amount_cents;
      entry.lastPaidAt = p.paid_at;
      bySale.set(p.sale_id, entry);
    }

    for (const [saleId, entry] of bySale) {
      const price = priceById.get(saleId) || 0;
      if (price > 0 && entry.total >= price) {
        const completedAt = new Date(entry.lastPaidAt);
        if (completedAt >= startDate && completedAt <= endDate) {
          soldInPeriod += 1;
          if (completedAt >= oneWeekAgo) soldThisWeek += 1;
        }
      }
    }
  }

  const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000));
  const weekNumber = Math.min(goal.duration_weeks, Math.floor(daysElapsed / 7) + 1);
  const daysLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 86400000));
  const weeksRemaining = Math.max(1, Math.ceil(daysLeft / 7));
  const remaining = Math.max(0, goal.target_count - soldInPeriod);
  const weeklyPaceNeeded = Math.round((remaining / weeksRemaining) * 10) / 10;

  const expectedByNow = (goal.target_count / goal.duration_weeks) * Math.min(weekNumber, goal.duration_weeks);
  const onPace = soldInPeriod >= expectedByNow * 0.9;

  const percentComplete = Math.min(100, Math.round((soldInPeriod / goal.target_count) * 100));

  return {
    goal,
    soldInPeriod,
    soldThisWeek,
    weekNumber,
    totalWeeks: goal.duration_weeks,
    daysLeft,
    weeklyPaceNeeded,
    onPace,
    percentComplete,
  };
}
