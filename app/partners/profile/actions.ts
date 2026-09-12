"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAffiliateUser } from "../../../lib/authz";
import type { AffiliatePayoutMethod } from "../../../lib/affiliateTypes";

export type ActionResult = { success: true } | { success: false; error: string };

export interface MyPayoutInfoFields {
  method: AffiliatePayoutMethod | null;
  handle: string;
  phone: string;
}

/** Affiliate self-service update - scoped to their own row only via requireAffiliateUser's affiliateId, never a client-supplied id. */
export async function updateMyPayoutInfo(fields: MyPayoutInfoFields): Promise<ActionResult> {
  const auth = await requireAffiliateUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliates")
    .update({
      payout_method: fields.method,
      payout_handle: fields.handle.trim() || null,
      phone: fields.phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.affiliateId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/partners/profile");
  return { success: true };
}
