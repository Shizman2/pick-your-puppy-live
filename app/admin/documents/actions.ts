"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { getActiveTemplateBySlug, getSaleDocumentContext } from "../../../lib/documents";
import type { BillOfSaleResolvedData } from "../../../lib/documentTypes";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export type GenerateDocumentResult = { success: true; documentId: string } | { success: false; error: string };

/**
 * Generates a fresh draft of any native document type for a sale:
 * resolves every merge field from the real Contact/Puppy/Sale/Payment
 * rows right now and freezes that into resolved_data, along with which
 * exact template version was used. Nothing about the master template
 * is touched. Shared by generateBillOfSale/generateHealthGuarantee
 * below rather than duplicated per document type.
 */
async function generateDocument(saleId: string, templateSlug: string, missingTemplateError: string): Promise<GenerateDocumentResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const templateAndVersion = await getActiveTemplateBySlug(templateSlug);
  if (!templateAndVersion) {
    return { success: false, error: missingTemplateError };
  }

  const context = await getSaleDocumentContext(saleId);
  if (!context) {
    return { success: false, error: "Couldn't load this sale's contact/puppy data." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("generated_documents")
    .insert({
      template_id: templateAndVersion.template.id,
      template_version_id: templateAndVersion.version.id,
      contact_id: context.contactId,
      puppy_id: context.puppyId,
      sale_id: saleId,
      resolved_data: context.resolvedData,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/sales/${saleId}`);
  return { success: true, documentId: data.id };
}

export async function generateBillOfSale(saleId: string): Promise<GenerateDocumentResult> {
  return generateDocument(saleId, "bill-of-sale", "The Bill of Sale template hasn't been set up yet.");
}

export async function generateHealthGuarantee(saleId: string): Promise<GenerateDocumentResult> {
  return generateDocument(saleId, "health-guarantee", "The Health Guarantee template hasn't been set up yet.");
}

export async function generateRefundPolicy(saleId: string): Promise<GenerateDocumentResult> {
  return generateDocument(saleId, "refund-policy", "The Refund Policy template hasn't been set up yet.");
}

export async function generatePuppyPurchaseAcknowledgement(saleId: string): Promise<GenerateDocumentResult> {
  return generateDocument(
    saleId,
    "puppy-purchase-acknowledgement",
    "The Puppy Purchase Acknowledgement template hasn't been set up yet."
  );
}

/**
 * Saves an edit to THIS ONE generated copy only - never touches the
 * template or its versions. Only allowed while still a draft; a
 * finalized document is locked (no un-finalize/edit-after-finalize
 * flow exists on purpose). Same resolved-data shape for every document
 * type generated from a sale, so this one action covers all of them.
 */
export async function updateGeneratedDocumentContent(
  documentId: string,
  edited: BillOfSaleResolvedData
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("generated_documents")
    .select("status")
    .eq("id", documentId)
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!existing) return { success: false, error: "Document not found." };
  if (existing.status === "finalized") {
    return { success: false, error: "This document is finalized and can no longer be edited." };
  }

  const { error } = await admin
    .from("generated_documents")
    .update({ edited_content: edited, updated_at: new Date().toISOString() })
    .eq("id", documentId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/documents/${documentId}`);
  return { success: true };
}

// Finalization (rendering the frozen HTML snapshot) lives in
// pages/api/documents/[id]/finalize.ts, not here - see that file for
// why it can't be a Server Action.
