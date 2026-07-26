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

export async function startNewGoal(
  targetCount: number,
  durationWeeks: number,
  startDate: string
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (targetCount <= 0 || durationWeeks <= 0) {
    return { success: false, error: "Enter a valid target and duration." };
  }

  const admin = createAdminClient();

  // Only one active goal at a time - retire the current one.
  await admin.from("sales_goals").update({ status: "completed" }).eq("status", "active");

  const { error } = await admin.from("sales_goals").insert({
    target_count: targetCount,
    duration_weeks: durationWeeks,
    start_date: startDate,
    status: "active",
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/dashboard");
  return { success: true };
}
