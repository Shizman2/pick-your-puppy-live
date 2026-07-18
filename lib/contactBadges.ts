import "server-only";
import type { ContactBadge, InquiryType } from "./contactTypes";

const INQUIRY_TYPE_BADGE: Record<InquiryType, { icon: string; label: string } | null> = {
  // puppy_interest doesn't get its own generic badge - the specific
  // puppy-name interest badge below already communicates it, and a
  // second "Puppy Interest" chip next to "Leo" would just be noise.
  puppy_interest: null,
  puppy_finder: { icon: "🐶", label: "Puppy Finder" },
  pypl: { icon: "📺", label: "PYPL Registered" },
  general: { icon: "💬", label: "General Question" },
};

export interface InquiryForBadges {
  id: string;
  contact_id: string;
  inquiry_type: InquiryType;
  puppy_name: string | null;
  breed: string | null;
  subject: string | null;
}

/**
 * Turns one contact's full inquiry history into the set of badges
 * shown for them (Contacts list and Contact Profile both use this).
 * Every still-active inquiry contributes its badge(s) - nothing here
 * drops an older inquiry just because a newer one came in. An inquiry
 * only stops contributing badges if its paired interests row was
 * explicitly marked inactive (see `interests.is_active` in the
 * schema).
 */
export function badgesForContact(
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
 * Given a contact's raw inquiries and interests rows, returns the set
 * of inquiry ids that should still count as "active" - i.e. every
 * inquiry except ones whose paired interests row was explicitly
 * deactivated. No matching interests row at all defaults to active.
 */
export function activeInquiryIdsFor(
  inquiries: InquiryForBadges[],
  interestRows: { inquiry_id: string | null; is_active: boolean }[]
): Set<string> {
  const inactiveIds = new Set(
    interestRows
      .filter((row) => row.is_active === false)
      .map((row) => row.inquiry_id)
      .filter((id): id is string => Boolean(id))
  );

  return new Set(inquiries.filter((i) => !inactiveIds.has(i.id)).map((i) => i.id));
}
