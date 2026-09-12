"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdminUser } from "../../../lib/authz";

export type ActionResult = { success: true } | { success: false; error: string };
export type CreatePayoutResult = { success: true; payoutId: string } | { success: false; error: string };

export async function createPayout(
  affiliateId: string,
  commissionIds: string[],
  payoutMethod: string,
  payoutReference: string
): Promise<CreatePayoutResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (commissionIds.length === 0) {
    return { success: false, error: "Select at least one approved commission." };
  }

  const admin = createAdminClient();
  const { data: payoutId, error } = await admin.rpc("create_affiliate_payout", {
    p_affiliate_id: affiliateId,
    p_commission_ids: commissionIds,
    p_payout_method: payoutMethod || null,
    p_payout_reference: payoutReference || null,
    p_created_by: auth.userId,
  });

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "payout",
    entity_id: payoutId,
    action: "created",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    metadata: { affiliate_id: affiliateId, commission_ids: commissionIds },
  });

  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/affiliates/${affiliateId}`);
  revalidatePath("/admin/commissions");
  return { success: true, payoutId };
}

export async function markPayoutPaid(payoutId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.rpc("mark_affiliate_payout_paid", {
    p_payout_id: payoutId,
    p_paid_by: auth.userId,
  });

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "payout",
    entity_id: payoutId,
    action: "marked_paid",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
  });

  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/payouts/${payoutId}`);
  revalidatePath("/admin/commissions");
  return { success: true };
}

export async function voidPayout(payoutId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };
  if (!reason.trim()) return { success: false, error: "A reason is required to void a payout." };

  const admin = createAdminClient();
  const { error } = await admin.rpc("void_affiliate_payout", {
    p_payout_id: payoutId,
    p_voided_by: auth.userId,
    p_reason: reason.trim(),
  });

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "payout",
    entity_id: payoutId,
    action: "voided",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    reason: reason.trim(),
  });

  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/payouts/${payoutId}`);
  revalidatePath("/admin/commissions");
  return { success: true };
}
