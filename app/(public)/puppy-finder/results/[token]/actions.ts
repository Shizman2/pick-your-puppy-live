"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { sendPushToAdmins, sanitizeForNotification } from "../../../../../lib/push";

export type ChooseResult = { success: true } | { success: false; error: string };

/**
 * Public, token-gated action - no admin auth here on purpose. Anyone
 * with the private link can call this, which is fine: the token itself
 * is the access control (same model as the events.slug private show
 * link), and every write below is scoped to the exact proposal/option
 * the token resolves to.
 */
export async function chooseOption(token: string, optionId: string): Promise<ChooseResult> {
  if (!token || !optionId) return { success: false, error: "Missing information." };

  const admin = createAdminClient();

  const { data: proposal, error: proposalError } = await admin
    .from("puppy_finder_proposals")
    .select("id, contact_id, status")
    .eq("access_token", token)
    .maybeSingle();

  if (proposalError || !proposal) return { success: false, error: "This link is invalid." };
  if (proposal.status !== "proposed") {
    return { success: false, error: "A puppy has already been selected for this request." };
  }

  const { data: option, error: optionError } = await admin
    .from("puppy_finder_options")
    .select("id, proposal_id, status, name, breed")
    .eq("id", optionId)
    .maybeSingle();

  if (optionError || !option || option.proposal_id !== proposal.id) {
    return { success: false, error: "This puppy option couldn't be found." };
  }
  if (option.status !== "active") {
    return { success: false, error: "This puppy is no longer available." };
  }

  const nowIso = new Date().toISOString();

  // The partial unique index on (proposal_id) where is_selected is the
  // real guarantee against a double-selection race - this update is the
  // first line of defense, that index is the last one.
  const { error: optionUpdateError } = await admin
    .from("puppy_finder_options")
    .update({ is_selected: true, selected_at: nowIso })
    .eq("id", optionId);

  if (optionUpdateError) {
    return { success: false, error: "Someone may have already made a selection. Please refresh and try again." };
  }

  await admin.from("puppy_finder_proposals").update({ status: "selected" }).eq("id", proposal.id);

  const puppyLabel = option.name || option.breed || "a puppy";

  await admin.from("timeline_events").insert({
    contact_id: proposal.contact_id,
    event_type: "puppy_finder_option_selected",
    description: `Selected "${puppyLabel}" from their Puppy Finder options`,
    metadata: { proposal_id: proposal.id, option_id: optionId },
  });

  const { data: contact } = await admin
    .from("contacts")
    .select("first_name")
    .eq("id", proposal.contact_id)
    .maybeSingle();

  const name = sanitizeForNotification(contact?.first_name, 40) || "A customer";
  const puppyName = sanitizeForNotification(puppyLabel, 40);
  await sendPushToAdmins("puppy_finder_selection", {
    title: "Puppy Selected!",
    body: `${name} chose ${puppyName}.`,
    url: `/admin/contacts/${proposal.contact_id}`,
    tag: "puppy_finder_selection",
  });

  revalidatePath(`/puppy-finder/results/${token}`);
  revalidatePath(`/admin/contacts/${proposal.contact_id}`);

  return { success: true };
}
