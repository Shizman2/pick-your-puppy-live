import { createAdminClient } from "./supabase/admin";

interface FindOrCreateInput {
  firstName: string;
  lastName?: string;
  phone?: string;
  phoneNormalized: string | null;
  email?: string;
  emailNormalized: string | null;
  city?: string;
  state?: string;
  preferredContactMethod?: string;
  consentToContact: boolean;
  source: string;
}

/**
 * Finds an existing contact by normalized phone or email, or creates
 * a new one. If phone and email point to two different existing
 * contacts, the phone match is used and the contact is flagged
 * (needs_duplicate_review) rather than silently merged or guessed at.
 */
export async function findOrCreateContact(input: FindOrCreateInput) {
  const admin = createAdminClient();

  let phoneMatch = null;
  let emailMatch = null;

  if (input.phoneNormalized) {
    const { data } = await admin
      .from("contacts")
      .select("*")
      .eq("phone_normalized", input.phoneNormalized)
      .limit(1)
      .maybeSingle();
    phoneMatch = data;
  }

  if (input.emailNormalized) {
    const { data } = await admin
      .from("contacts")
      .select("*")
      .eq("email_normalized", input.emailNormalized)
      .limit(1)
      .maybeSingle();
    emailMatch = data;
  }

  // Both matched, and they're the same contact - clean match.
  if (phoneMatch && emailMatch && phoneMatch.id === emailMatch.id) {
    return { contact: phoneMatch, isNew: false };
  }

  // Both matched, but to two different contacts - ambiguous. Use the
  // phone match as primary, flag for manual review rather than guess.
  if (phoneMatch && emailMatch && phoneMatch.id !== emailMatch.id) {
    await admin
      .from("contacts")
      .update({ needs_duplicate_review: true })
      .eq("id", phoneMatch.id);
    return { contact: phoneMatch, isNew: false, flaggedDuplicate: true };
  }

  // Only one matched.
  const existing = phoneMatch || emailMatch;
  if (existing) {
    return { contact: existing, isNew: false };
  }

  // No match - create a new contact.
  const { data: newContact, error } = await admin
    .from("contacts")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName || null,
      display_name: `${input.firstName} ${input.lastName || ""}`.trim(),
      phone: input.phone || null,
      phone_normalized: input.phoneNormalized,
      email: input.email || null,
      email_normalized: input.emailNormalized,
      city: input.city || null,
      state: input.state || null,
      preferred_contact_method: input.preferredContactMethod || null,
      consent_to_contact: input.consentToContact,
      source: input.source,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return { contact: newContact, isNew: true };
}
