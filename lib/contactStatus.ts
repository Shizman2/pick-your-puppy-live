import type { ContactStatus } from "./contactTypes";

export const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow-Up",
  reserved: "Reserved",
  customer: "Customer",
  closed: "Closed",
};

// Maps to CSS classes defined in contacts.css (contacts-status--<key>).
export const STATUS_CLASS: Record<ContactStatus, string> = {
  new: "new",
  contacted: "contacted",
  interested: "interested",
  follow_up: "follow-up",
  reserved: "reserved",
  customer: "customer",
  closed: "closed",
};
