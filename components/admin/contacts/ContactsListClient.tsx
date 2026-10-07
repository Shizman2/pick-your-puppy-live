"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContactListItem } from "../../../lib/contactTypes";
import { archiveContacts, restoreContacts } from "../../../app/admin/contacts/actions";
import DeleteConfirmModal from "../messages/DeleteConfirmModal";
import { STATUS_CLASS, STATUS_LABEL } from "../../../lib/contactStatus";
import { formatRelativeTime, formatShortDate, isFollowUpDue } from "../../../lib/formatRelative";
import { formatPhoneDisplay } from "../../../lib/phone";

type FilterKey =
  | "all"
  | "new"
  | "high_interest"
  | "puppy_interest"
  | "puppy_reservation"
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
  { key: "puppy_reservation", label: "Reservations" },
  { key: "puppy_finder", label: "Puppy Finder" },
  { key: "pypl", label: "PYPL Registered" },
  { key: "customer", label: "Customers" },
  { key: "follow_up", label: "Needs Follow-Up" },
  { key: "closed", label: "Closed" },
];

type ViewKey = "active" | "archived";

type PendingBulkAction = { kind: "archive" | "restore"; scope: "selected" | "all"; ids: string[] };

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
    case "puppy_reservation":
      return contact.inquiryTypes.includes("puppy_reservation");
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
  const router = useRouter();
  const [view, setView] = useState<ViewKey>("active");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<PendingBulkAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const activeContacts = useMemo(() => contacts.filter((c) => !c.is_archived), [contacts]);
  const archivedContacts = useMemo(() => contacts.filter((c) => c.is_archived), [contacts]);
  const viewContacts = view === "active" ? activeContacts : archivedContacts;

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      all: 0,
      new: 0,
      high_interest: 0,
      puppy_interest: 0,
      puppy_reservation: 0,
      puppy_finder: 0,
      pypl: 0,
      customer: 0,
      follow_up: 0,
      closed: 0,
    };
    for (const key of Object.keys(counts) as FilterKey[]) {
      counts[key] = viewContacts.filter((c) => matchesFilter(c, key)).length;
    }
    return counts;
  }, [viewContacts]);

  const visibleContacts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return viewContacts
      .filter((c) => matchesFilter(c, filter))
      .filter((c) => (q ? searchableText(c).includes(q) : true))
      .sort((a, b) => compareForSort(a, b, sort));
  }, [viewContacts, filter, query, sort]);

  // Only rows the admin can currently see ever count as selected - a
  // contact ticked before the filter/search changed can never be
  // archived invisibly, and rows that disappear after a refresh drop out.
  const selectedVisibleIds = useMemo(
    () => visibleContacts.filter((c) => selectedIds.has(c.id)).map((c) => c.id),
    [visibleContacts, selectedIds]
  );
  const allVisibleSelected = visibleContacts.length > 0 && selectedVisibleIds.length === visibleContacts.length;
  const someVisibleSelected = selectedVisibleIds.length > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  function switchView(next: ViewKey) {
    setView(next);
    setSelectedIds(new Set());
    setNotice(null);
  }

  function toggleSelected(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleContacts.map((c) => c.id)));
  }

  function openBulkAction(kind: PendingBulkAction["kind"], scope: PendingBulkAction["scope"]) {
    // "all" = every contact in the CURRENT filtered/searched view, never
    // every contact in the database.
    const ids = scope === "all" ? visibleContacts.map((c) => c.id) : selectedVisibleIds;
    if (ids.length === 0) return;
    setActionError(null);
    setNotice(null);
    setPendingAction({ kind, scope, ids });
  }

  function closeBulkAction() {
    if (actionBusy) return;
    setPendingAction(null);
    setActionError(null);
  }

  async function confirmBulkAction() {
    if (!pendingAction) return;
    setActionBusy(true);
    setActionError(null);

    const result =
      pendingAction.kind === "archive"
        ? await archiveContacts(pendingAction.ids)
        : await restoreContacts(pendingAction.ids);

    setActionBusy(false);

    if (!result.success) {
      setActionError(result.error);
      return;
    }

    const verb = pendingAction.kind === "archive" ? "Archived" : "Restored";
    setNotice(`${verb} ${result.count} contact${result.count === 1 ? "" : "s"}.`);
    setSelectedIds(new Set());
    setPendingAction(null);
    router.refresh();
  }

  const filterLabel = FILTERS.find((f) => f.key === filter)?.label || "All";
  const trimmedQuery = query.trim();
  const pendingCount = pendingAction?.ids.length || 0;
  const pendingPlural = pendingCount === 1 ? "" : "s";

  let modalBody = "";
  if (pendingAction?.kind === "archive") {
    modalBody =
      "These contacts will be removed from your active Contacts list and Message Center. Their business history will be preserved - sales, payments, inquiries, messages and Puppy Finder proposals are not deleted. You can restore them anytime from the Archived view.";
    if (pendingAction.scope === "all") {
      modalBody += ` This applies to the ${pendingCount} contact${pendingPlural} in your current view (filter: ${filterLabel}${
        trimmedQuery ? `, search: "${trimmedQuery}"` : ""
      }), not every contact.`;
    }
  } else if (pendingAction?.kind === "restore") {
    modalBody =
      "These contacts will return to your active Contacts list, and any conversations they have will reappear in the Message Center.";
  }

  return (
    <div className="contacts-page">
      <div className="contacts-page-header">
        <div>
          <h1 className="contacts-title">Contacts</h1>
          <p className="contacts-subtitle">
            {activeContacts.length} active contact{activeContacts.length === 1 ? "" : "s"}
            {archivedContacts.length > 0 ? ` · ${archivedContacts.length} archived` : ""}
          </p>
        </div>
        <Link href="/admin/contacts/new" className="admin-btn admin-btn--primary">
          + New Contact
        </Link>
      </div>

      <div className="contacts-viewtabs" role="tablist" aria-label="Contact view">
        <button
          type="button"
          role="tab"
          aria-selected={view === "active"}
          className={`contacts-filter-chip${view === "active" ? " active" : ""}`}
          onClick={() => switchView("active")}
        >
          Active
          <span className="contacts-filter-count">{activeContacts.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "archived"}
          className={`contacts-filter-chip${view === "archived" ? " active" : ""}`}
          onClick={() => switchView("archived")}
        >
          Archived
          <span className="contacts-filter-count">{archivedContacts.length}</span>
        </button>
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

      {notice && <p className="contacts-bulk-notice">{notice}</p>}

      {visibleContacts.length > 0 && (
        <div className="contacts-bulkbar">
          <label className="contacts-bulkbar-selectall">
            <input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
            Select all ({visibleContacts.length})
          </label>
          {view === "active" ? (
            <>
              <button
                type="button"
                className="admin-btn"
                disabled={selectedVisibleIds.length === 0}
                onClick={() => openBulkAction("archive", "selected")}
              >
                Archive Selected{selectedVisibleIds.length > 0 ? ` (${selectedVisibleIds.length})` : ""}
              </button>
              <button
                type="button"
                className="admin-btn"
                title="Archives every contact in the current filtered view"
                onClick={() => openBulkAction("archive", "all")}
              >
                Archive All ({visibleContacts.length})
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={selectedVisibleIds.length === 0}
              onClick={() => openBulkAction("restore", "selected")}
            >
              Restore Selected{selectedVisibleIds.length > 0 ? ` (${selectedVisibleIds.length})` : ""}
            </button>
          )}
        </div>
      )}

      {visibleContacts.length === 0 ? (
        <div className="contacts-empty">
          {view === "archived" && archivedContacts.length === 0
            ? "No archived contacts."
            : "No contacts match your filters yet."}
        </div>
      ) : (
        <div className="contacts-list" role="table">
          <div className="contacts-rowwrap contacts-rowwrap--header">
            <span className="contacts-select-cell" aria-hidden="true" />
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
          </div>

          {visibleContacts.map((contact) => {
            const due = isFollowUpDue(contact.next_follow_up_at);
            const checked = selectedIds.has(contact.id);
            return (
              <div className={`contacts-rowwrap${checked ? " selected" : ""}`} key={contact.id}>
                {/* Kept outside the row's <Link> so ticking a box never navigates. */}
                <label className="contacts-select-cell">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(contact.id)}
                    aria-label={`Select ${contactDisplayName(contact)}`}
                  />
                </label>
                <Link href={`/admin/contacts/${contact.id}`} className="contacts-row" role="row">
                  <div data-label="Name" className="contacts-cell contacts-cell--name" role="cell">
                    <span className="contacts-name">{contactDisplayName(contact)}</span>
                    {contact.needs_duplicate_review && (
                      <span className="contacts-flag" title="Possible duplicate - needs review">
                        ⚠️ Review
                      </span>
                    )}
                  </div>

                  <div data-label="Phone" className="contacts-cell" role="cell">
                    {contact.phone ? formatPhoneDisplay(contact.phone) : "—"}
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
                    {contact.hasUnread ? (
                      <span className="contacts-unread-badge" title="Unread customer message waiting">
                        Unread
                      </span>
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
              </div>
            );
          })}
        </div>
      )}

      {pendingAction && (
        <DeleteConfirmModal
          title={`${pendingAction.kind === "archive" ? "Archive" : "Restore"} ${pendingCount} contact${pendingPlural}?`}
          body={modalBody}
          confirmLabel={pendingAction.kind === "archive" ? "Archive" : "Restore"}
          busyLabel={pendingAction.kind === "archive" ? "Archiving…" : "Restoring…"}
          tone="primary"
          busy={actionBusy}
          error={actionError}
          onCancel={closeBulkAction}
          onConfirm={confirmBulkAction}
        />
      )}
    </div>
  );
}
