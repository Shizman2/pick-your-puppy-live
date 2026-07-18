import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContactListItem, ContactRow } from "./contactTypes";
import { activeInquiryIdsFor, badgesForContact, type InquiryForBadges } from "./contactBadges";

/**
 * Fetches every contact plus enough of their inquiries/interests/
 * messages to build list-page badges, breed search terms, and unread
 * counts. Deliberately does this in a small handful of plain queries
 * rather than a single complex join or a Postgres view/RPC - Phase 1A
 * scale is a single small business's contact list, not a dataset that
 * needs that kind of optimization yet.
 */
export async function getContactsListData(): Promise<ContactListItem[]> {
  const admin = createAdminClient();

  const { data: contactsData, error: contactsError } = await admin
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (contactsError) throw new Error(contactsError.message);

  const contacts = (contactsData || []) as ContactRow[];
  const contactIds = contacts.map((c) => c.id);

  if (contactIds.length === 0) {
    return [];
  }

  const [{ data: inquiriesData, error: inquiriesError }, { data: interestsData, error: interestsError }, { data: unreadData, error: unreadError }] =
    await Promise.all([
      admin
        .from("inquiries")
        .select("id, contact_id, inquiry_type, puppy_name, breed, subject, created_at")
        .in("contact_id", contactIds),
      admin.from("interests").select("inquiry_id, is_active").in("contact_id", contactIds),
      admin
        .from("messages")
        .select("contact_id")
        .in("contact_id", contactIds)
        .eq("direction", "inbound")
        .eq("is_read", false),
    ]);

  if (inquiriesError) throw new Error(inquiriesError.message);
  if (interestsError) throw new Error(interestsError.message);
  if (unreadError) throw new Error(unreadError.message);

  const inquiries = (inquiriesData || []) as InquiryForBadges[];
  const interestRows = (interestsData || []) as { inquiry_id: string | null; is_active: boolean }[];

  const inquiriesByContact = new Map<string, InquiryForBadges[]>();
  for (const inquiry of inquiries) {
    const list = inquiriesByContact.get(inquiry.contact_id) || [];
    list.push(inquiry);
    inquiriesByContact.set(inquiry.contact_id, list);
  }

  const unreadCountByContact = new Map<string, number>();
  for (const row of (unreadData || []) as { contact_id: string }[]) {
    unreadCountByContact.set(row.contact_id, (unreadCountByContact.get(row.contact_id) || 0) + 1);
  }

  return contacts.map((contact) => {
    const contactInquiries = inquiriesByContact.get(contact.id) || [];
    const activeInquiryIds = activeInquiryIdsFor(contactInquiries, interestRows);

    const inquiryTypes = Array.from(
      new Set(
        contactInquiries.filter((i) => activeInquiryIds.has(i.id)).map((i) => i.inquiry_type)
      )
    );

    const breeds = Array.from(
      new Set(
        contactInquiries
          .filter((i) => i.inquiry_type === "puppy_finder" && i.breed)
          .map((i) => i.breed as string)
      )
    );

    return {
      ...contact,
      badges: badgesForContact(contactInquiries, activeInquiryIds),
      breeds,
      inquiryTypes,
      unreadCount: unreadCountByContact.get(contact.id) || 0,
    };
  });
}
