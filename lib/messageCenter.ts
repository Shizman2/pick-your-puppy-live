import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContactBadge, ContactRow, InquiryType, NoteRow, TimelineEventRow } from "./contactTypes";
import { activeInquiryIdsFor, badgesForContact, type InquiryForBadges } from "./contactBadges";
import { SOURCE_LABEL } from "./messageSource";

export interface MessageRow {
  id: string;
  conversation_id: string;
  contact_id: string;
  direction: "inbound" | "outbound";
  sent_by: string | null;
  channel: string | null;
  body: string | null;
  status: string | null;
  is_read: boolean;
  created_at: string;
}

export interface InquiryDetailRow {
  id: string;
  inquiry_type: InquiryType;
  created_at: string;
  puppy_name: string | null;
  breed: string | null;
  subject: string | null;
  form_data: Record<string, unknown> | null;
}

export interface MessageCenterListItem {
  contactId: string;
  contactName: string;
  badges: ContactBadge[];
  sources: string[];
  receivedAt: string;
  lastActivityAt: string | null;
  leadScore: number;
  status: ContactRow["status"];
  unreadCount: number;
}

export interface MessageCenterDetail {
  contact: ContactRow;
  badges: ContactBadge[];
  inquiries: InquiryDetailRow[];
  timelineEvents: TimelineEventRow[];
  notes: NoteRow[];
  messages: MessageRow[];
}

export interface MessageCenterData {
  list: MessageCenterListItem[];
  detailsByContactId: Record<string, MessageCenterDetail>;
}

/**
 * Loads everything the read-only Message Center needs in one page
 * load - the conversation list plus a full detail bundle for every
 * contact, keyed by contact id. Phase 1A scale (a single small
 * business's inbox) makes this simpler and fast enough without
 * needing per-conversation round trips as the user clicks around.
 */
export async function getMessageCenterData(): Promise<MessageCenterData> {
  const admin = createAdminClient();

  const { data: contactsData, error: contactsError } = await admin
    .from("contacts")
    .select("*")
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (contactsError) throw new Error(contactsError.message);

  const contacts = (contactsData || []) as ContactRow[];
  const contactIds = contacts.map((c) => c.id);

  if (contactIds.length === 0) {
    return { list: [], detailsByContactId: {} };
  }

  const [
    { data: inquiriesData, error: inquiriesError },
    { data: interestsData, error: interestsError },
    { data: timelineData, error: timelineError },
    { data: notesData, error: notesError },
    { data: messagesData, error: messagesError },
  ] = await Promise.all([
    admin
      .from("inquiries")
      .select("id, contact_id, inquiry_type, puppy_name, breed, subject, form_data, created_at")
      .in("contact_id", contactIds)
      .order("created_at", { ascending: true }),
    admin.from("interests").select("inquiry_id, is_active, contact_id").in("contact_id", contactIds),
    admin
      .from("timeline_events")
      .select("*")
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false }),
    admin.from("notes").select("*").in("contact_id", contactIds).order("created_at", { ascending: false }),
    admin
      .from("messages")
      .select("*")
      .in("contact_id", contactIds)
      .order("created_at", { ascending: true }),
  ]);

  if (inquiriesError) throw new Error(inquiriesError.message);
  if (interestsError) throw new Error(interestsError.message);
  if (timelineError) throw new Error(timelineError.message);
  if (notesError) throw new Error(notesError.message);
  if (messagesError) throw new Error(messagesError.message);

  const inquiries = (inquiriesData || []) as (InquiryDetailRow & { contact_id: string })[];
  const interestRows = (interestsData || []) as { inquiry_id: string | null; is_active: boolean; contact_id: string }[];
  const timelineEvents = (timelineData || []) as TimelineEventRow[];
  const notes = (notesData || []) as NoteRow[];
  const messages = (messagesData || []) as MessageRow[];

  const groupBy = <T extends { contact_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const list = map.get(row.contact_id) || [];
      list.push(row);
      map.set(row.contact_id, list);
    }
    return map;
  };

  const inquiriesByContact = groupBy(inquiries);
  const interestsByContact = groupBy(interestRows);
  const timelineByContact = groupBy(timelineEvents);
  const notesByContact = groupBy(notes);
  const messagesByContact = groupBy(messages);

  const list: MessageCenterListItem[] = [];
  const detailsByContactId: Record<string, MessageCenterDetail> = {};

  for (const contact of contacts) {
    const contactInquiries = inquiriesByContact.get(contact.id) || [];
    const contactInterests = interestsByContact.get(contact.id) || [];
    const contactMessages = messagesByContact.get(contact.id) || [];

    const activeInquiryIds = activeInquiryIdsFor(
      contactInquiries as InquiryForBadges[],
      contactInterests
    );
    const badges = badgesForContact(contactInquiries as InquiryForBadges[], activeInquiryIds);

    const sources =
      contactInquiries.length > 0
        ? Array.from(new Set(contactInquiries.map((i) => SOURCE_LABEL[i.inquiry_type])))
        : ["Manually added"];

    const unreadCount = contactMessages.filter((m) => m.direction === "inbound" && !m.is_read).length;

    list.push({
      contactId: contact.id,
      contactName: contact.display_name || `${contact.first_name} ${contact.last_name || ""}`.trim(),
      badges,
      sources,
      receivedAt: contactInquiries[0]?.created_at || contact.created_at,
      lastActivityAt: contact.last_activity_at,
      leadScore: contact.lead_score,
      status: contact.status,
      unreadCount,
    });

    detailsByContactId[contact.id] = {
      contact,
      badges,
      inquiries: contactInquiries,
      timelineEvents: timelineByContact.get(contact.id) || [],
      notes: notesByContact.get(contact.id) || [],
      messages: contactMessages,
    };
  }

  return { list, detailsByContactId };
}
