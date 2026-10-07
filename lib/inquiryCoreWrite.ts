import "server-only";
import { createAdminClient } from "./supabase/admin";
import { findOrCreateContact } from "./duplicateMatch";

/**
 * The core, must-succeed part of a website inquiry submission: match or
 * create the contact (restoring them if archived), the inquiry, its
 * interest, the contact's general conversation, the inbound message and
 * the needs_reply state - everything the Message Center depends on.
 *
 * Normally this is ONE database transaction via the
 * submit_website_inquiry function (supabase/035_submit_website_inquiry_rpc.sql):
 * either all of it is saved or none of it is, so a failed submission
 * never leaves a contact without an inquiry, or an inquiry/conversation
 * without its message, and a retry starts clean.
 *
 * Everything optional (affiliate attribution, favorites, timeline, lead
 * score, push, GHL, analytics) stays in the route, after this succeeds.
 */

export interface InquiryCoreInput {
  firstName: string;
  lastName: string;
  phone: string;
  phoneNormalized: string | null;
  email: string;
  emailNormalized: string | null;
  city: string;
  state: string;
  preferredContactMethod: string;
  consentToContact: boolean;
  source: string;
  /** Type-specific inquiries columns (no contact_id - that's set here). */
  inquiryColumns: Record<string, unknown>;
  interestType: string;
  interestLabel: string;
  messageBody: string;
}

export interface SavedContact {
  id: string;
  lead_score: number | null;
  [column: string]: unknown;
}

export type InquiryCoreResult =
  | { ok: true; contact: SavedContact; isNew: boolean; flaggedDuplicate: boolean; inquiryId: string }
  | { ok: false; step: string; contactId: string | null; error: unknown };

export async function saveInquiryCore(input: InquiryCoreInput): Promise<InquiryCoreResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("submit_website_inquiry", {
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_phone: input.phone,
    p_phone_normalized: input.phoneNormalized,
    p_email: input.email,
    p_email_normalized: input.emailNormalized,
    p_city: input.city,
    p_state: input.state,
    p_preferred_contact_method: input.preferredContactMethod,
    p_consent_to_contact: input.consentToContact,
    p_source: input.source,
    p_inquiry: input.inquiryColumns,
    p_interest_type: input.interestType,
    p_interest_label: input.interestLabel,
    p_message_body: input.messageBody,
  });

  if (!error) {
    const result = data as {
      contact: SavedContact;
      is_new: boolean;
      flagged_duplicate: boolean;
      inquiry_id: string;
    };
    return {
      ok: true,
      contact: result.contact,
      isNew: result.is_new,
      flaggedDuplicate: result.flagged_duplicate,
      inquiryId: result.inquiry_id,
    };
  }

  // PGRST202 = PostgREST can't find the function at all, i.e. migration
  // 035 hasn't been run yet. Only in that case fall back to the previous
  // step-by-step writes, so deploying this code before the migration
  // never stops submissions. Any other error means the transaction ran
  // and was rolled back - nothing was saved, so just report the failure.
  if (error.code !== "PGRST202") {
    return { ok: false, step: "submit_website_inquiry transaction", contactId: null, error };
  }

  console.error(
    "[inquire] submit_website_inquiry is not installed - run supabase/035_submit_website_inquiry_rpc.sql. " +
      "Falling back to non-atomic step-by-step writes for this submission."
  );
  return saveInquiryCoreStepByStep(input);
}

/**
 * Pre-migration fallback ONLY - the previous behavior: the same writes
 * as separate, individually checked PostgREST calls. Not atomic: a
 * failure part-way leaves the earlier rows behind. Can be deleted once
 * migration 035 is confirmed in production.
 */
async function saveInquiryCoreStepByStep(input: InquiryCoreInput): Promise<InquiryCoreResult> {
  const admin = createAdminClient();

  let found: Awaited<ReturnType<typeof findOrCreateContact>>;
  try {
    found = await findOrCreateContact({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      phoneNormalized: input.phoneNormalized,
      email: input.email,
      emailNormalized: input.emailNormalized,
      city: input.city,
      state: input.state,
      preferredContactMethod: input.preferredContactMethod,
      consentToContact: input.consentToContact,
      source: input.source,
    });
  } catch (err) {
    return { ok: false, step: "find or create contact", contactId: null, error: err };
  }
  const contact = found.contact as SavedContact;

  if (contact.is_archived) {
    const { error } = await admin
      .from("contacts")
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq("id", contact.id);
    if (error) return { ok: false, step: "un-archive returning contact", contactId: contact.id, error };
  }

  const inquiryColumns: Record<string, unknown> = { ...input.inquiryColumns, contact_id: contact.id };
  let { data: inquiry, error: inquiryError } = await admin.from("inquiries").insert(inquiryColumns).select().single();

  // analytics_visitor_id/analytics_session_id only exist once
  // supabase/029_inquiry_analytics_attribution.sql has been run; PostgREST
  // rejects unknown keys with PGRST204, so retry once without them.
  if (inquiryError?.code === "PGRST204") {
    const { analytics_visitor_id, analytics_session_id, ...columnsWithoutAnalytics } = inquiryColumns;
    const retry = await admin.from("inquiries").insert(columnsWithoutAnalytics).select().single();
    inquiry = retry.data;
    inquiryError = retry.error;
  }
  if (inquiryError || !inquiry) return { ok: false, step: "inquiry", contactId: contact.id, error: inquiryError };

  const { error: interestError } = await admin.from("interests").insert({
    contact_id: contact.id,
    inquiry_id: inquiry.id,
    interest_type: input.interestType,
    label: input.interestLabel,
  });
  if (interestError) {
    console.error(`[inquire] interest insert failed for contact ${contact.id}:`, interestError.message);
  }

  const { data: existingConversation, error: lookupError } = await admin
    .from("conversations")
    .select("*")
    .eq("contact_id", contact.id)
    .eq("conversation_type", "general")
    .limit(1)
    .maybeSingle();
  if (lookupError) return { ok: false, step: "conversation lookup", contactId: contact.id, error: lookupError };

  let conversation = existingConversation;
  if (!conversation) {
    const { data: created, error: createError } = await admin
      .from("conversations")
      .insert({ contact_id: contact.id, conversation_type: "general" })
      .select()
      .single();
    if (createError || !created) return { ok: false, step: "conversation create", contactId: contact.id, error: createError };
    conversation = created;
  }

  const { error: messageError } = await admin.from("messages").insert({
    conversation_id: conversation.id,
    contact_id: contact.id,
    direction: "inbound",
    sent_by: "customer",
    channel: "website_form",
    body: input.messageBody,
    status: "logged",
    is_read: false,
  });
  if (messageError) return { ok: false, step: "inbound message", contactId: contact.id, error: messageError };

  const { error: statusError } = await admin
    .from("conversations")
    .update({ status: "needs_reply", last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);
  if (statusError) {
    console.error(`[inquire] conversation status update failed for contact ${contact.id} (message was saved):`, statusError.message);
  }

  return {
    ok: true,
    contact,
    isNew: found.isNew,
    flaggedDuplicate: Boolean(found.flaggedDuplicate),
    inquiryId: inquiry.id,
  };
}
