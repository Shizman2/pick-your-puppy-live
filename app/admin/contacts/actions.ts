"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { ContactStatus, InterestLevel } from "../../../lib/contactTypes";

async function requireAdminUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user;
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
export async function updateContactStatus(contactId: string, fields: ContactStatusFields) {
  await requireAdminUser();

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

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin/contacts");
}

export async function addContactNote(contactId: string, body: string) {
  const user = await requireAdminUser();

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Note can't be empty");

  const admin = createAdminClient();
  const { error } = await admin.from("notes").insert({
    contact_id: contactId,
    author: user.email || "Staff",
    body: trimmed,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/contacts/${contactId}`);
}
