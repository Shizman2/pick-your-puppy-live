import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContactBadge, ContactListItem, ContactRow, InquiryType } from "./contactTypes";

const INQUIRY_TYPE_BADGE: Record<InquiryType, { icon: string; label: string } | null> = {
  // puppy_interest doesn't get its own generic badge - the specific
  // puppy-name interest badge below already communicates it, and a
  // second "Puppy Interest" chip next to "Leo" would just be noise.
  puppy_interest: null,
  puppy_finder: { icon: "🐶", label: "Puppy Finder" },
  pypl: { icon: "📺", label: "PYPL Registered" },
  general: { icon: "💬", label: "General Question" },
};

interface InquiryForBadges {
  id: string;
  contact_id: string;
  inquiry_type: InquiryType;
  puppy_name: string | null;
  breed: string | null;
  subject: string | null;
}

/**
 * Turns one contact's full inquiry history into the set of badges the
 * Contacts list shows for them. Every still-active inquiry contributes
 * its badge(s) - nothing here drops an older inquiry just because a
 * newer one came in. An inquiry only stops contributing badges if its
 * paired interests row was explicitly marked inactive (see
 * `interests.is_active` in the schema).
 */
function badgesForContact(
  inquiries: InquiryForBadges[],
  activeInquiryIds: Set<string>
): ContactBadge[] {
  const badges: ContactBadge[] = [];
  const seenKeys = new Set<string>();

  const addBadge = (badge: ContactBadge) => {
    if (seenKeys.has(badge.key)) return;
    seenKeys.add(badge.key);
    badges.push(badge);
  };

  for (const inquiry of inquiries) {
    if (!activeInquiryIds.has(inquiry.id)) continue;

    const typeBadge = INQUIRY_TYPE_BADGE[inquiry.inquiry_type];
    if (typeBadge) {
      addBadge({
        key: `type:${inquiry.inquiry_type}`,
        icon: typeBadge.icon,
        label: typeBadge.label,
        kind: "inquiry_type",
      });
    }

    if (inquiry.inquiry_type === "puppy_interest" && inquiry.puppy_name) {
      addBadge({
        key: `interest:puppy:${inquiry.puppy_name.toLowerCase()}`,
        icon: "❤️",
        label: inquiry.puppy_name,
        kind: "interest",
      });
    }

    if (inquiry.inquiry_type === "puppy_finder" && inquiry.breed) {
      addBadge({
        key: `interest:breed:${inquiry.breed.toLowerCase()}`,
        icon: "🐕",
        label: inquiry.breed,
        kind: "interest",
      });
    }

    if (inquiry.inquiry_type === "general" && inquiry.subject) {
      // Replace the generic "General Question" badge with the actual
      // subject when we have one - more useful at a glance.
      const genericKey = "type:general";
      const idx = badges.findIndex((b) => b.key === genericKey);
      if (idx !== -1) {
        badges[idx] = { ...badges[idx], label: inquiry.subject };
      }
    }
  }

  return badges;
}

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

  // An inquiry counts as "active" unless it has a matching interests
  // row that was explicitly deactivated. No matching row at all (or no
  // is_active info) defaults to active - conservative, since hiding an
  // otherwise-real inquiry is worse than showing one that should have
  // been retired.
  const inactiveInquiryIds = new Set(
    (interestsData || [])
      .filter((row: { inquiry_id: string | null; is_active: boolean }) => row.is_active === false)
      .map((row: { inquiry_id: string | null }) => row.inquiry_id)
      .filter((id): id is string => Boolean(id))
  );

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

  const shaped: ContactListItem[] = contacts.map((contact) => {
    const contactInquiries = inquiriesByContact.get(contact.id) || [];
    const activeInquiryIds = new Set(
      contactInquiries.filter((i) => !inactiveInquiryIds.has(i.id)).map((i) => i.id)
    );

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

  return shaped;
}
