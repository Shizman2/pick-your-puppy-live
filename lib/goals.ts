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
 * A puppy counts toward the goal on the date it became sold
 * (puppies.sold_at) - inventory status is the source of truth for
 * "when did this sell", deliberately independent of payments/revenue.
 * A puppy marked sold today counts today even if it's not paid off
 * yet; a puppy that's fully paid but never marked sold does not count
 * until its status is updated. This is real, derived data - never a
 * fabricated or manually-entered count.
 */
export async function getGoalProgress(goal: SalesGoalRow): Promise<GoalProgress> {
  const admin = createAdminClient();
  const startDate = new Date(goal.start_date);
  const endDate = new Date(startDate.getTime() + goal.duration_weeks * 7 * 86400000);
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
