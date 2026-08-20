"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { resizeImageForWeb } from "../../../lib/imageProcessing";
import type { OptionStatus } from "../../../lib/puppyFinderTypes";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export type CreateProposalResult = { success: true; proposalId: string } | { success: false; error: string };

export async function createProposal(contactId: string, inquiryId: string | null): Promise<CreateProposalResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("puppy_finder_proposals")
    .insert({
      contact_id: contactId,
      inquiry_id: inquiryId,
      access_token: crypto.randomUUID(),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/contacts/${contactId}`);
  return { success: true, proposalId: data.id };
}

/**
 * Permanently deletes an entire proposal, including every puppy option
 * on it - `puppy_finder_options.proposal_id` cascades on delete, so
 * there's nothing extra to clean up here. This is separate from
 * deleting/withdrawing a single option: that only removes one puppy
 * card, this removes the proposal (and its private link) entirely.
 */
export async function deleteProposalPermanently(proposalId: string, contactId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("puppy_finder_proposals").delete().eq("id", proposalId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/contacts/${contactId}`);
  return { success: true };
}

export interface OptionFormFields {
  name: string;
  breed: string;
  gender: string;
  ageText: string;
  color: string;
  sizeText: string;
  priceCents: number | null;
  description: string;
  healthNotes: string;
  displayOrder: number;
}

function optionFieldsToRow(fields: OptionFormFields) {
  return {
    name: fields.name.trim() || null,
    breed: fields.breed.trim() || null,
    gender: fields.gender.trim() || null,
    age_text: fields.ageText.trim() || null,
    color: fields.color.trim() || null,
    size_text: fields.sizeText.trim() || null,
    price_cents: fields.priceCents,
    description: fields.description.trim() || null,
    health_notes: fields.healthNotes.trim() || null,
    display_order: fields.displayOrder,
  };
}

export type SaveOptionResult = { success: true; optionId: string } | { success: false; error: string };

export async function addOption(proposalId: string, fields: OptionFormFields): Promise<SaveOptionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("puppy_finder_proposals")
    .select("contact_id")
    .eq("id", proposalId)
    .maybeSingle();

  const { data, error } = await admin
    .from("puppy_finder_options")
    .insert({ proposal_id: proposalId, ...optionFieldsToRow(fields) })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  if (proposal?.contact_id) revalidatePath(`/admin/contacts/${proposal.contact_id}`);
  return { success: true, optionId: data.id };
}

export async function updateOption(
  optionId: string,
  proposalId: string,
  fields: OptionFormFields
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("puppy_finder_options").update(optionFieldsToRow(fields)).eq("id", optionId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  return { success: true };
}

/**
 * Withdrawing an option that is currently the customer's selection also
 * clears that selection and reopens the proposal (status back to
 * 'proposed') so they can pick a different one - unless the deposit has
 * already been confirmed, in which case this is a rare edge case that
 * needs to be sorted out manually rather than silently unwound.
 */
export async function setOptionStatus(
  optionId: string,
  proposalId: string,
  status: OptionStatus
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: option } = await admin
    .from("puppy_finder_options")
    .select("is_selected")
    .eq("id", optionId)
    .maybeSingle();

  const updates: Record<string, unknown> = { status };

  if (status === "withdrawn" && option?.is_selected) {
    const { data: proposal } = await admin
      .from("puppy_finder_proposals")
      .select("status")
      .eq("id", proposalId)
      .maybeSingle();

    if (proposal?.status === "deposit_confirmed") {
      return {
        success: false,
        error: "The deposit has already been confirmed for this option - contact support before withdrawing it.",
      };
    }

    updates.is_selected = false;
    updates.selected_at = null;
    await admin.from("puppy_finder_proposals").update({ status: "proposed" }).eq("id", proposalId);
  }

  const { error } = await admin.from("puppy_finder_options").update(updates).eq("id", optionId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  return { success: true };
}

export async function deleteOptionPermanently(optionId: string, proposalId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("puppy_finder_options").delete().eq("id", optionId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  return { success: true };
}

export type UploadPhotoResult = { success: true; url: string } | { success: false; error: string };

export async function uploadOptionPhoto(
  optionId: string,
  proposalId: string,
  formData: FormData
): Promise<UploadPhotoResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };

  const admin = createAdminClient();

  let processedBuffer: Buffer;
  let contentType: string;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const result = await resizeImageForWeb(inputBuffer);
    processedBuffer = result.buffer;
    contentType = result.contentType;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? `Image processing failed: ${err.message}` : "Image processing failed.",
    };
  }

  const filePath = `puppy-finder/${optionId}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await admin.storage.from("puppy-finder-photos").upload(filePath, processedBuffer, {
    upsert: true,
    contentType,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("puppy-finder-photos").getPublicUrl(filePath);

  const { data: option, error: fetchError } = await admin
    .from("puppy_finder_options")
    .select("photo_urls")
    .eq("id", optionId)
    .maybeSingle();
  if (fetchError) return { success: false, error: fetchError.message };

  const updatedUrls = [...((option?.photo_urls as string[]) || []), publicUrl];

  const { error: updateError } = await admin
    .from("puppy_finder_options")
    .update({ photo_urls: updatedUrls })
    .eq("id", optionId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  return { success: true, url: publicUrl };
}

export async function removeOptionPhoto(optionId: string, proposalId: string, url: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { data: option, error: fetchError } = await admin
    .from("puppy_finder_options")
    .select("photo_urls")
    .eq("id", optionId)
    .maybeSingle();
  if (fetchError) return { success: false, error: fetchError.message };

  const updatedUrls = ((option?.photo_urls as string[]) || []).filter((u) => u !== url);

  const { error: updateError } = await admin
    .from("puppy_finder_options")
    .update({ photo_urls: updatedUrls })
    .eq("id", optionId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  return { success: true };
}

/**
 * Manual-only: records that the admin has personally received and
 * confirmed the required deposit off-site. No amount, no payment
 * method, no payments/sales row - this is a timestamped toggle, not a
 * transaction. Only allowed once the customer has actually selected a
 * puppy (status 'selected'); this is deliberately never true until the
 * admin clicks this, so the customer's page can never falsely claim
 * their puppy is secured.
 */
export async function confirmDepositReceived(proposalId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("puppy_finder_proposals")
    .select("status, contact_id")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) return { success: false, error: "Proposal not found." };
  if (proposal.status !== "selected") {
    return { success: false, error: "The customer hasn't selected a puppy yet." };
  }

  const { error } = await admin
    .from("puppy_finder_proposals")
    .update({ status: "deposit_confirmed", deposit_confirmed_at: new Date().toISOString() })
    .eq("id", proposalId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  revalidatePath(`/admin/contacts/${proposal.contact_id}`);
  return { success: true };
}
