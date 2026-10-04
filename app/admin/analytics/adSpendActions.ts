"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { AdSpendPlatform } from "../../../lib/adSpendTypes";
import { AD_SPEND_PLATFORM_OPTIONS } from "../../../lib/adSpendTypes";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export async function addAdSpendEntry(
  spendDate: string,
  amountDollars: number,
  platform: AdSpendPlatform,
  campaignName: string,
  note: string
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!spendDate) return { success: false, error: "Enter a date." };
  if (!amountDollars || amountDollars <= 0) return { success: false, error: "Enter a valid amount." };
  if (!AD_SPEND_PLATFORM_OPTIONS.includes(platform)) return { success: false, error: "Choose a valid platform." };

  const admin = createAdminClient();
  let { error } = await admin.from("ad_spend_entries").insert({
    spend_date: spendDate,
    amount_cents: Math.round(amountDollars * 100),
    platform,
    campaign_name: campaignName.trim() || null,
    note: note.trim() || null,
  });

  // Defensive compatibility: campaign_name only exists once
  // supabase/032_sale_costs_and_ad_campaign.sql has actually been run
  // (deliberately not run automatically). Until then, PostgREST rejects
  // the whole insert (PGRST204) - same pattern already used in
  // app/api/inquire/route.ts. Retrying without it keeps ad spend logging
  // working regardless of migration timing.
  if (error?.code === "PGRST204" || error?.code === "42703") {
    const retry = await admin.from("ad_spend_entries").insert({
      spend_date: spendDate,
      amount_cents: Math.round(amountDollars * 100),
      platform,
      note: note.trim() || null,
    });
    error = retry.error;
  }

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/analytics");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

/** Corrects an existing entry in place - same "edit rather than delete+re-add" pattern as updatePayment in app/admin/sales/actions.ts. */
export async function updateAdSpendEntry(
  id: string,
  spendDate: string,
  amountDollars: number,
  platform: AdSpendPlatform,
  campaignName: string,
  note: string
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!spendDate) return { success: false, error: "Enter a date." };
  if (!amountDollars || amountDollars <= 0) return { success: false, error: "Enter a valid amount." };
  if (!AD_SPEND_PLATFORM_OPTIONS.includes(platform)) return { success: false, error: "Choose a valid platform." };

  const admin = createAdminClient();
  let { error } = await admin
    .from("ad_spend_entries")
    .update({
      spend_date: spendDate,
      amount_cents: Math.round(amountDollars * 100),
      platform,
      campaign_name: campaignName.trim() || null,
      note: note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Same defensive pre-migration compatibility as addAdSpendEntry above.
  if (error?.code === "PGRST204" || error?.code === "42703") {
    const retry = await admin
      .from("ad_spend_entries")
      .update({
        spend_date: spendDate,
        amount_cents: Math.round(amountDollars * 100),
        platform,
        note: note.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    error = retry.error;
  }

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/analytics");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteAdSpendEntry(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("ad_spend_entries").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/analytics");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
