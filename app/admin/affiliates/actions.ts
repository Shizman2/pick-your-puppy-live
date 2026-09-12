"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdminUser } from "../../../lib/authz";
import type { AffiliateCommissionType, AffiliatePayoutMethod } from "../../../lib/affiliateTypes";

export type ActionResult = { success: true } | { success: false; error: string };
export type ApproveAffiliateResult =
  | { success: true; linkedExistingAccount: boolean }
  | { success: false; error: string };

/**
 * Approves a pending application: creates the real login via Supabase's
 * Admin Auth invite flow (sends the applicant a real set-password
 * email - this app never generates or transmits a password itself),
 * grants the 'affiliate' role, and activates their referral code.
 * Public sign-ups are disabled project-wide (see app/admin/login/page.tsx's
 * comment) - inviteUserByEmail uses the service-role Admin API, which
 * bypasses that restriction intentionally, the same way an admin
 * account here is only ever created directly, never via self sign-up.
 *
 * If the applicant's email already has an auth.users account (e.g. it's
 * the same email as an existing admin account, or they had some other
 * reason to already be registered), inviteUserByEmail fails with
 * "already been registered" - that's a real, expected case, not a bug
 * to surface as a hard failure. In that case this links the affiliate
 * role onto the EXISTING account instead of trying to create a new one,
 * and reports that no invite email was sent (they already have a
 * password for that account).
 */
export async function approveAffiliate(affiliateId: string): Promise<ApproveAffiliateResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: affiliate } = await admin.from("affiliates").select("id, email, status").eq("id", affiliateId).maybeSingle();
  if (!affiliate) return { success: false, error: "Affiliate not found." };
  if (affiliate.status !== "pending") return { success: false, error: "This application is not pending." };

  let authUserId: string | null = null;
  let linkedExistingAccount = false;

  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(affiliate.email);

  if (inviteError) {
    const alreadyRegistered = /already.*registered/i.test(inviteError.message || "");
    if (!alreadyRegistered) {
      return { success: false, error: inviteError.message };
    }

    // Find the existing auth user by email instead of failing the
    // approval outright - listUsers() has no server-side email filter
    // in this supabase-js version, so page through results and match
    // case-insensitively. One page comfortably covers this business's
    // user count; if that ever changes, this is the first place to revisit.
    const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return { success: false, error: `Could not resolve the existing account: ${listError.message}` };

    const match = usersPage.users.find((u) => u.email?.toLowerCase() === affiliate.email.toLowerCase());
    if (!match) {
      return { success: false, error: "An account with this email already exists, but it could not be located to link." };
    }

    authUserId = match.id;
    linkedExistingAccount = true;
  } else {
    authUserId = invite?.user?.id ?? null;
  }

  if (!authUserId) return { success: false, error: "Could not determine the affiliate's account." };

  const { error: updateError } = await admin
    .from("affiliates")
    .update({ auth_user_id: authUserId, status: "approved", approved_at: new Date().toISOString(), approved_by: auth.userId })
    .eq("id", affiliateId);

  if (updateError) return { success: false, error: updateError.message };

  await admin.from("user_roles").upsert({ user_id: authUserId, role: "affiliate" }, { onConflict: "user_id,role", ignoreDuplicates: true });

  await admin.from("affiliate_audit_log").insert({
    entity_type: "affiliate",
    entity_id: affiliateId,
    action: "approved",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    metadata: linkedExistingAccount ? { linked_existing_account: true } : undefined,
  });

  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true, linkedExistingAccount };
}

export async function rejectAffiliate(affiliateId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliates")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), rejected_by: auth.userId, rejected_reason: reason || null })
    .eq("id", affiliateId)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "affiliate",
    entity_id: affiliateId,
    action: "rejected",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    reason,
  });

  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true };
}

/**
 * Suspension is forward-looking only (blocks new clicks/attribution/
 * Sale credit, see lib/affiliateAttribution.ts's live status checks) -
 * it never touches existing commissions. If suspension is fraud-
 * related, use voidAllUnpaidCommissionsForAffiliate separately and
 * deliberately.
 */
export async function suspendAffiliate(affiliateId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!reason.trim()) return { success: false, error: "A reason is required to suspend an affiliate." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliates")
    .update({ status: "suspended", suspended_at: new Date().toISOString(), suspended_by: auth.userId, suspended_reason: reason.trim() })
    .eq("id", affiliateId)
    .eq("status", "approved");

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "affiliate",
    entity_id: affiliateId,
    action: "suspended",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
    reason,
  });

  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true };
}

export async function reinstateAffiliate(affiliateId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliates")
    .update({ status: "approved", suspended_at: null, suspended_by: null, suspended_reason: null })
    .eq("id", affiliateId)
    .eq("status", "suspended");

  if (error) return { success: false, error: error.message };

  await admin.from("affiliate_audit_log").insert({
    entity_type: "affiliate",
    entity_id: affiliateId,
    action: "reinstated",
    actor_user_id: auth.userId,
    actor_label: auth.email || "admin",
  });

  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true };
}

export interface CommissionSettingsFields {
  type: AffiliateCommissionType;
  flatCents: number | null;
  percentBp: number | null;
}

export async function updateAffiliateCommissionSettings(affiliateId: string, fields: CommissionSettingsFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (fields.type === "flat_cents" && (!fields.flatCents || fields.flatCents <= 0)) {
    return { success: false, error: "Enter a flat commission amount greater than zero." };
  }
  if (fields.type === "percent_bp" && (!fields.percentBp || fields.percentBp <= 0)) {
    return { success: false, error: "Enter a commission percentage greater than zero." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliates")
    .update({
      commission_type: fields.type,
      commission_flat_cents: fields.type === "flat_cents" ? fields.flatCents : null,
      commission_percent_bp: fields.type === "percent_bp" ? fields.percentBp : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true };
}

export interface PayoutInfoFields {
  method: AffiliatePayoutMethod | null;
  handle: string;
  notes: string;
}

export async function updateAffiliatePayoutInfo(affiliateId: string, fields: PayoutInfoFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliates")
    .update({
      payout_method: fields.method,
      payout_handle: fields.handle.trim() || null,
      payout_notes: fields.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true };
}

export async function updateAffiliateAdminNotes(affiliateId: string, notes: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("affiliates").update({ notes: notes.trim() || null }).eq("id", affiliateId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/affiliates/${affiliateId}`);
  return { success: true };
}

/**
 * Fraud-response convenience action (blueprint section E): voids every
 * not-yet-paid commission for this affiliate in one click, but still
 * writes one audit-log entry per commission voided, never a single
 * vague "bulk voided" entry - so it's always clear exactly which
 * commissions were touched and why. Paid commissions are never touched.
 */
export async function voidAllUnpaidCommissionsForAffiliate(affiliateId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!reason.trim()) return { success: false, error: "A reason is required." };

  const admin = createAdminClient();
  const { data: commissions, error: fetchError } = await admin
    .from("affiliate_commissions")
    .select("id")
    .eq("affiliate_id", affiliateId)
    .in("status", ["pending", "approved", "in_payout"]);

  if (fetchError) return { success: false, error: fetchError.message };
  if (!commissions || commissions.length === 0) return { success: true };

  const { error: voidError } = await admin
    .from("affiliate_commissions")
    .update({ status: "void", voided_at: new Date().toISOString(), voided_reason: reason.trim(), voided_by: auth.userId })
    .in("id", commissions.map((c) => c.id));

  if (voidError) return { success: false, error: voidError.message };

  await admin.from("affiliate_audit_log").insert(
    commissions.map((c) => ({
      entity_type: "commission" as const,
      entity_id: c.id,
      action: "voided",
      actor_user_id: auth.userId,
      actor_label: auth.email || "admin",
      reason: reason.trim(),
    }))
  );

  revalidatePath(`/admin/affiliates/${affiliateId}`);
  revalidatePath("/admin/commissions");
  return { success: true };
}
