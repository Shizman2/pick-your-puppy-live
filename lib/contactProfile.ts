import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContactProfileData, ContactRow, NoteRow, TimelineEventRow } from "./contactTypes";
import type { ActivityRow } from "./activityTypes";
import { activeInquiryIdsFor, badgesForContact, type InquiryForBadges } from "./contactBadges";

/**
 * Fetches everything the Contact Profile page shows: the contact
 * itself, badges (same logic as the list page), the timeline feed,
 * and notes. Deliberately does NOT fetch the message thread - that's
 * the Message Center's job (next checkpoint), not the profile's. The
 * unreadCount here is only used for the "Messages" placeholder card's
 * summary line, e.g. "3 unread messages".
 */
export async function getContactProfileData(contactId: string): Promise<ContactProfileData | null> {
  const admin = createAdminClient();

  const { data: contactData, error: contactError } = await admin
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();

  if (contactError) throw new Error(contactError.message);
  if (!contactData) return null;

  const contact = contactData as ContactRow;

  const [
    { data: inquiriesData, error: inquiriesError },
    { data: interestsData, error: interestsError },
    { data: timelineData, error: timelineError },
    { data: notesData, error: notesError },
    { data: unreadData, error: unreadError },
    { data: activitiesData, error: activitiesError },
  ] = await Promise.all([
    admin
      .from("inquiries")
      .select("id, contact_id, inquiry_type, puppy_name, breed, subject, created_at")
      .eq("contact_id", contactId),
    admin.from("interests").select("inquiry_id, is_active").eq("contact_id", contactId),
    admin
      .from("timeline_events")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
    admin
      .from("notes")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
    admin
      .from("messages")
      .select("id")
      .eq("contact_id", contactId)
      .eq("direction", "inbound")
      .eq("is_read", false),
    admin
      .from("activities")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
  ]);

  if (inquiriesError) throw new Error(inquiriesError.message);
  if (interestsError) throw new Error(interestsError.message);
  if (timelineError) throw new Error(timelineError.message);
  if (notesError) throw new Error(notesError.message);
  if (unreadError) throw new Error(unreadError.message);
  if (activitiesError) throw new Error(activitiesError.message);

  const inquiries = (inquiriesData || []) as InquiryForBadges[];
  const interestRows = (interestsData || []) as { inquiry_id: string | null; is_active: boolean }[];
  const activeInquiryIds = activeInquiryIdsFor(inquiries, interestRows);

  return {
    contact,
    badges: badgesForContact(inquiries, activeInquiryIds),
    timelineEvents: (timelineData || []) as TimelineEventRow[],
    notes: (notesData || []) as NoteRow[],
    activities: (activitiesData || []) as ActivityRow[],
    unreadCount: (unreadData || []).length,
  };
}
