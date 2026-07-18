"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ContactListItem } from "../../../lib/contactTypes";
import { STATUS_CLASS, STATUS_LABEL } from "../../../lib/contactStatus";
import { formatRelativeTime, formatShortDate, isFollowUpDue } from "../../../lib/formatRelative";

type FilterKey =
  | "all"
  | "new"
  | "high_interest"
  | "puppy_interest"
  | "puppy_finder"
  | "pypl"
  | "customer"
  | "follow_up"
  | "closed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "high_interest", label: "High Interest" },
  { key: "puppy_interest", label: "Puppy Interest" },
  { key: "puppy_finder", label: "Puppy Finder" },
  { key: "pypl", label: "PYPL Registered" },
  { key: "customer", label: "Customers" },
  { key: "follow_up", label: "Needs Follow-Up" },
  { key: "closed", label: "Closed" },
];

type SortKey = "newest" | "oldest" | "most_active" | "follow_up_due" | "high_interest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "most_active", label: "Most Recently Active" },
  { key: "follow_up_due", label: "Follow-Up Due" },
  { key: "high_interest", label: "High Interest" },
];

function matchesFilter(contact: ContactListItem, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "new":
      return contact.status === "new";
    case "high_interest":
      return contact.interest_level === "high";
    case "puppy_interest":
      return contact.inquiryTypes.includes("puppy_interest");
    case "puppy_finder":
      return contact.inquiryTypes.includes("puppy_finder");
    case "pypl":
      return contact.inquiryTypes.includes("pypl");
    case "customer":
      return contact.status === "customer";
    case "follow_up":
      return Boolean(contact.next_follow_up_at);
    case "closed":
      return contact.status === "closed";
    default:
      return true;
  }
}

function compareForSort(a: ContactListItem, b: ContactListItem, sort: SortKey): number {
  switch (sort) {
    case "newest":
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    case "oldest":
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    case "most_active": {
      const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
      const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
      return bTime - aTime;
    }
    case "follow_up_due": {
      // Contacts without a follow-up date sort to the end either way.
      const aTime = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Infinity;
      const bTime = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Infinity;
      return aTime - bTime;
    }
    case "high_interest":
      return b.lead_score - a.lead_score;
    default:
      return 0;
  }
}

function contactDisplayName(contact: ContactListItem): string {
  if (contact.display_name && contact.display_name.trim()) return contact.display_name;
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function searchableText(contact: ContactListItem): string {
  return [
    contactDisplayName(contact),
    contact.phone,
    contact.email,
    contact.source,
    ...contact.breeds,
    ...contact.badges.map((b) => b.label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function ContactsListClient({ contacts }: { contacts: ContactListItem[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      all: 0,
      new: 0,
      high_interest: 0,
      puppy_interest: 0,
      puppy_finder: 0,
      pypl: 0,
      customer: 0,
      follow_up: 0,
      closed: 0,
    };
    for (const key of Object.keys(counts) as FilterKey[]) {
      counts[key] = contacts.filter((c) => matchesFilter(c, key)).length;
    }
    return counts;
  }, [contacts]);

  const visibleContacts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return contacts
      .filter((c) => matchesFilter(c, filter))
      .filter((c) => (q ? searchableText(c).includes(q) : true))
      .sort((a, b) => compareForSort(a, b, sort));
  }, [contacts, filter, query, sort]);

  return (
    <div className="contacts-page">
      <div className="contacts-page-header">
        <div>
          <h1 className="contacts-title">Contacts</h1>
          <p className="contacts-subtitle">
            {contacts.length} total contact{contacts.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="contacts-toolbar">
        <input
          type="search"
          className="contacts-search"
          placeholder="Search name, phone, email, puppy, or breed…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="contacts-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort contacts"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="contacts-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`contacts-filter-chip${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="contacts-filter-count">{filterCounts[f.key]}</span>
          </button>
        ))}
      </div>

      {visibleContacts.length === 0 ? (
        <div className="contacts-empty">No contacts match your filters yet.</div>
      ) : (
        <div className="contacts-list" role="table">
          <div className="contacts-row contacts-row--header" role="row">
            <div role="columnheader">Name</div>
            <div role="columnheader">Phone</div>
            <div role="columnheader">Email</div>
            <div role="columnheader">Status</div>
            <div role="columnheader">Interests</div>
            <div role="columnheader">Last Contact</div>
            <div role="columnheader">Unread</div>
            <div role="columnheader">Next Follow-up</div>
            <div role="columnheader">Source</div>
          </div>

          {visibleContacts.map((contact) => {
            const due = isFollowUpDue(contact.next_follow_up_at);
            return (
              <Link
                href={`/admin/contacts/${contact.id}`}
                className="contacts-row"
                role="row"
                key={contact.id}
              >
                <div data-label="Name" className="contacts-cell contacts-cell--name" role="cell">
                  <span className="contacts-name">{contactDisplayName(contact)}</span>
                  {contact.needs_duplicate_review && (
                    <span className="contacts-flag" title="Possible duplicate - needs review">
                      ⚠️ Review
                    </span>
                  )}
                </div>

                <div data-label="Phone" className="contacts-cell" role="cell">
                  {contact.phone || "—"}
                </div>

                <div data-label="Email" className="contacts-cell" role="cell">
                  {contact.email || "—"}
                </div>

                <div data-label="Status" className="contacts-cell" role="cell">
                  <span className={`contacts-status contacts-status--${STATUS_CLASS[contact.status]}`}>
                    {STATUS_LABEL[contact.status]}
                  </span>
                </div>

                <div data-label="Interests" className="contacts-cell contacts-cell--badges" role="cell">
                  {contact.badges.length === 0 ? (
                    <span className="contacts-muted">—</span>
                  ) : (
                    contact.badges.map((badge) => (
                      <span className="contacts-badge" key={badge.key}>
                        <span aria-hidden="true">{badge.icon}</span> {badge.label}
                      </span>
                    ))
                  )}
                </div>

                <div data-label="Last Contact" className="contacts-cell" role="cell">
                  {formatRelativeTime(contact.last_activity_at)}
                </div>

                <div data-label="Unread" className="contacts-cell" role="cell">
                  {contact.unreadCount > 0 ? (
                    <span className="contacts-unread-badge">{contact.unreadCount}</span>
                  ) : (
                    <span className="contacts-muted">—</span>
                  )}
                </div>

                <div data-label="Next Follow-up" className="contacts-cell" role="cell">
                  {contact.next_follow_up_at ? (
                    <span className={due ? "contacts-follow-up-due" : ""}>
                      {formatShortDate(contact.next_follow_up_at)}
                    </span>
                  ) : (
                    <span className="contacts-muted">—</span>
                  )}
                </div>

                <div data-label="Source" className="contacts-cell" role="cell">
                  {contact.source || "—"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
