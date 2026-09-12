"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdminUser } from "../../../lib/authz";
import { resizeImageForWeb } from "../../../lib/imageProcessing";
import type { OptionStatus } from "../../../lib/puppyFinderTypes";
import { slugify } from "../../../lib/puppyTypes";
import { startSale } from "../sales/actions";

export type ActionResult = { success: true } | { success: false; error: string };

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

export type ConfirmDepositResult = { success: true; saleId: string } | { success: false; error: string };

/**
 * Confirming the deposit is the canonical Puppy Finder -> Puppy -> Sale
 * conversion point (blueprint section B). The selected option is
 * promoted into a real puppies row (source_puppy_finder_option_id
 * remembers where it came from; show_on_website defaults to false -
 * this was sourced for one specific customer, not public catalog
 * inventory), and a normal Sale is started through the exact same
 * startSale() every other sale uses - no parallel sales-creation path.
 * From this point on the puppy behaves exactly like any catalog puppy:
 * same payments, fulfillment tracking, and affiliate commission flow.
 */
export async function confirmDepositReceived(proposalId: string, salePriceCents: number): Promise<ConfirmDepositResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!salePriceCents || salePriceCents <= 0) {
    return { success: false, error: "Enter a valid sale price." };
  }

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

  const { data: option } = await admin
    .from("puppy_finder_options")
    .select("*")
    .eq("proposal_id", proposalId)
    .eq("is_selected", true)
    .maybeSingle();

  if (!option) return { success: false, error: "No selected puppy option found on this proposal." };

  const puppyName = option.name || "Puppy Finder Puppy";
  // puppy_finder_options.gender is free text (admin-typed, no
  // constraint); puppies.gender is a strict 'male'|'female' check
  // constraint - normalize rather than pass the raw string through.
  const normalizedGender = (option.gender || "").trim().toLowerCase().startsWith("f") ? "female" : "male";
  const { data: puppy, error: puppyError } = await admin
    .from("puppies")
    .insert({
      name: puppyName,
      slug: `${slugify(puppyName, option.breed || "puppy")}-${option.id.slice(0, 8)}`,
      breed: option.breed || "Unknown",
      price_cents: option.price_cents || salePriceCents,
      gender: normalizedGender,
      color: option.color || null,
      description: option.description || null,
      photo_urls: option.photo_urls || [],
      status: "hold",
      show_on_website: false,
      source_puppy_finder_option_id: option.id,
    })
    .select("id")
    .single();

  if (puppyError || !puppy) {
    return { success: false, error: puppyError?.message || "Could not create the puppy record." };
  }

  await admin.from("puppy_finder_options").update({ converted_puppy_id: puppy.id }).eq("id", option.id);

  const saleResult = await startSale(puppy.id, proposal.contact_id, salePriceCents);
  if (!saleResult.success) return { success: false, error: saleResult.error };

  const { error } = await admin
    .from("puppy_finder_proposals")
    .update({ status: "deposit_confirmed", deposit_confirmed_at: new Date().toISOString() })
    .eq("id", proposalId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/puppy-finder/${proposalId}`);
  revalidatePath(`/admin/contacts/${proposal.contact_id}`);
  return { success: true, saleId: saleResult.saleId };
}
