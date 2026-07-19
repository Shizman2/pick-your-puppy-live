"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { ContactStatus, InterestLevel } from "../../../lib/contactTypes";

/**
 * Next.js redacts thrown-error messages from Server Actions before
 * they reach the client in production builds (a deliberate security
 * measure, to avoid leaking internal details by default). That means
 * `throw new Error(...)` here would show up in the browser as a
 * generic "An error occurred..." message with no way to see what
 * actually broke - useless for debugging a real Postgres error like a
 * missing column. So instead of throwing, every action below returns
 * a plain { success, error? } object, and the actual message is sent
 * back to the client on purpose, since these are internal admin-only
 * actions, not public-facing.
 */
export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUser(): Promise<
  { ok: true; user: { email: string | null } } | { ok: false; error: string }
> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  return { ok: true, user: { email: user.email ?? null } };
}

export interface ContactStatusFields {
  status: ContactStatus;
  interest_level: InterestLevel | null;
  next_follow_up_at: string | null;
  closed_reason: string | null;
}

/**
 * Saves the editable "who is this person / what do I need to do next"
 * fields from the Contact Profile header. Does not touch anything
 * related to messages or conversations - that stays out of this page
 * on purpose (see Message Center note in contactProfile.ts).
 */
export async function updateContactStatus(
  contactId: string,
  fields: ContactStatusFields
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("contacts")
    .update({
      status: fields.status,
      interest_level: fields.interest_level,
      next_follow_up_at: fields.next_follow_up_at,
      // Only keep a closed_reason around while the contact is actually
      // closed - clears itself out if they get reopened later so an
      // old reason doesn't linger and look current.
      closed_reason: fields.status === "closed" ? fields.closed_reason : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin/contacts");
  return { success: true };
}

export async function addContactNote(contactId: string, body: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: "Note can't be empty" };

  const admin = createAdminClient();
  const { error } = await admin.from("notes").insert({
    contact_id: contactId,
    created_by: auth.user.email || "Staff",
    body: trimmed,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/contacts/${contactId}`);
  return { success: true };
}

export interface NewContactFields {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: ContactStatus;
}

export type AddContactResult =
  | { success: true; contactId: string; matchedExisting: boolean }
  | { success: false; error: string };

/**
 * Manually adds a contact from the admin side (phone call, walk-in,
 * lead from somewhere else) - separate from the automatic path
 * through /inquire. Uses the same phone/email normalization as that
 * form so duplicate detection is consistent either way: if a match is
 * found, no new row is created - the existing contact's id is
 * returned instead, so the UI can send the admin straight to that
 * profile rather than silently create a second record for the same
 * person.
 */
export async function addContact(fields: NewContactFields): Promise<AddContactResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const firstName = fields.firstName.trim();
  if (!firstName) return { success: false, error: "First name is required." };

  const phone = fields.phone.trim();
  const email = fields.email.trim();
  if (!phone && !email) {
    return { success: false, error: "Enter at least a phone number or email." };
  }

  const { normalizePhone, normalizeEmail } = await import("../../../lib/normalize");
  const phoneNormalized = normalizePhone(phone);
  const emailNormalized = normalizeEmail(email);

  const admin = createAdminClient();

  let existing = null;
  if (phoneNormalized) {
    const { data } = await admin
      .from("contacts")
      .select("id")
      .eq("phone_normalized", phoneNormalized)
      .limit(1)
      .maybeSingle();
    existing = data;
  }
  if (!existing && emailNormalized) {
    const { data } = await admin
      .from("contacts")
      .select("id")
      .eq("email_normalized", emailNormalized)
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  if (existing) {
    return { success: true, contactId: existing.id, matchedExisting: true };
  }

  const { data: newContact, error } = await admin
    .from("contacts")
    .insert({
      first_name: firstName,
      last_name: fields.lastName.trim() || null,
      display_name: `${firstName} ${fields.lastName.trim()}`.trim(),
      phone: phone || null,
      phone_normalized: phoneNormalized,
      email: email || null,
      email_normalized: emailNormalized,
      city: fields.city.trim() || null,
      state: fields.state.trim() || null,
      status: fields.status,
      source: "manual_admin_entry",
      last_activity_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await admin.from("timeline_events").insert({
    contact_id: newContact.id,
    event_type: "contact_created_manually",
    description: "Added manually by staff",
  });

  revalidatePath("/admin/contacts");
  revalidatePath("/admin/messages");

  return { success: true, contactId: newContact.id, matchedExisting: false };
}
