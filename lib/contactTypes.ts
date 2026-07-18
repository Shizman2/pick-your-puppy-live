export type ContactStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "reserved"
  | "customer"
  | "closed";

export type InterestLevel = "low" | "medium" | "high";

export type InquiryType = "puppy_interest" | "puppy_finder" | "pypl" | "general";

export interface ContactRow {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  status: ContactStatus;
  closed_reason: string | null;
  interest_level: InterestLevel | null;
  lead_score: number;
  last_activity_at: string | null;
  next_follow_up_at: string | null;
  needs_duplicate_review: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * One badge shown on the Contacts list - can represent either a
 * distinct inquiry type the contact has submitted (e.g. "Puppy
 * Finder", "PYPL Registered") or a still-active specific interest
 * (a named puppy, a breed). Every past inquiry/interest contributes a
 * badge - a new inquiry adds to this list, it never replaces or hides
 * an older one.
 */
export interface ContactBadge {
  key: string;
  label: string;
  icon: string;
  kind: "inquiry_type" | "interest";
}

/**
 * The shaped-for-the-list-page view of a contact, built server-side by
 * combining the contacts row with its inquiries/interests/messages.
 * This is what actually gets sent down to the client component.
 */
export interface ContactListItem extends ContactRow {
  badges: ContactBadge[];
  breeds: string[];
  inquiryTypes: InquiryType[];
  unreadCount: number;
}

export interface TimelineEventRow {
  id: string;
  contact_id: string;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NoteRow {
  id: string;
  contact_id: string;
  created_by: string | null;
  body: string;
  created_at: string;
}

/**
 * The Contact Profile page's shaped view: the contact row plus badges
 * and everything Phase 1A's profile actually shows (timeline, notes,
 * unread count for the Messages placeholder). Deliberately does NOT
 * include the message thread itself - that's the Message Center's
 * job, not the profile's. See lib/contactProfile.ts.
 */
export interface ContactProfileData {
  contact: ContactRow;
  badges: ContactBadge[];
  timelineEvents: TimelineEventRow[];
  notes: NoteRow[];
  unreadCount: number;
}
