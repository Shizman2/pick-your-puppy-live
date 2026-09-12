"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdminUser } from "../../../lib/authz";

export type ActionResult = { success: true } | { success: false; error: string };

export async function voidCommission(commissionId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };
  if (!reason.trim()) return { success: false, error: "A reason is required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliate_commissions")
    .update({ status: "void", voided_at: new Date().toISOString(), voided_reason: reason.trim(), voided_by: auth.userId })
    .eq("id", commissionId)
    .in("status", ["pending", "approved", "in_payout"]);

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "commission",
    entity_id: commissionId,
    action: "voided",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    reason: reason.trim(),
  });

  revalidatePath("/admin/commissions");
  return { success: true };
}

/**
 * Deliberate admin override - bypasses the automatic eligibility gate
 * (hold period + paid-in-full) on purpose, for a judgment-call case the
 * standard rule doesn't fit. Always requires a reason and always writes
 * an audit entry, since this is the one path that skips the normal
 * financial gate.
 */
export async function manuallyApproveCommission(commissionId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };
  if (!reason.trim()) return { success: false, error: "A reason is required for a manual approval override." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliate_commissions")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", commissionId)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "commission",
    entity_id: commissionId,
    action: "manually_approved",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    reason: reason.trim(),
  });

  revalidatePath("/admin/commissions");
  return { success: true };
}

/** Best-effort backstop in case pg_cron lags - see blueprint section J. */
export async function runAutoApprovalNow(): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.rpc("approve_eligible_commissions");
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/commissions");
  return { success: true };
}
