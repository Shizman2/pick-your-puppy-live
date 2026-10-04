"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

function validateGoalInput(
  name: string,
  targetCount: number,
  startDate: string,
  endDate: string
): { ok: true; durationWeeks: number } | { ok: false; error: string } {
  if (!name.trim()) return { ok: false, error: "Enter a goal name." };
  if (!targetCount || targetCount <= 0) return { ok: false, error: "Enter a valid target." };

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return { ok: false, error: "Enter a valid date range (end date must be after start date)." };
  }

  // duration_weeks is kept in sync for any older code/report that
  // still reads it, but getGoalProgress() now calculates everything
  // from start_date/end_date directly - see lib/goals.ts.
  const durationWeeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));
  return { ok: true, durationWeeks };
}

export async function startNewGoal(
  name: string,
  targetCount: number,
  startDate: string,
  endDate: string,
  revenueGoalDollars: number | null,
  profitGoalDollars: number | null
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const validation = validateGoalInput(name, targetCount, startDate, endDate);
  if (!validation.ok) return { success: false, error: validation.error };

  const admin = createAdminClient();

  // Only one active goal at a time - retire the current one.
  await admin.from("sales_goals").update({ status: "completed" }).eq("status", "active");

  const { error } = await admin.from("sales_goals").insert({
    name: name.trim(),
    target_count: targetCount,
    duration_weeks: validation.durationWeeks,
    start_date: startDate,
    end_date: endDate,
    status: "active",
    revenue_goal_cents: revenueGoalDollars != null ? Math.round(revenueGoalDollars * 100) : null,
    profit_goal_cents: profitGoalDollars != null ? Math.round(profitGoalDollars * 100) : null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/dashboard");
  return { success: true };
}

/**
 * Edits the goal in place (same row/id) rather than retiring and
 * creating a new one - this is "change my settings", not "start a
 * new goal period". Target/dates take effect immediately; progress
 * is recalculated fresh on next dashboard load since getGoalProgress
 * always derives everything from the saved row, never a cached value.
 */
export async function updateGoal(
  goalId: string,
  name: string,
  targetCount: number,
  startDate: string,
  endDate: string,
  revenueGoalDollars: number | null,
  profitGoalDollars: number | null
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const validation = validateGoalInput(name, targetCount, startDate, endDate);
  if (!validation.ok) return { success: false, error: validation.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sales_goals")
    .update({
      name: name.trim(),
      target_count: targetCount,
      duration_weeks: validation.durationWeeks,
      start_date: startDate,
      end_date: endDate,
      revenue_goal_cents: revenueGoalDollars != null ? Math.round(revenueGoalDollars * 100) : null,
      profit_goal_cents: profitGoalDollars != null ? Math.round(profitGoalDollars * 100) : null,
    })
    .eq("id", goalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/dashboard");
  return { success: true };
}
