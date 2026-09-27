"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MessageCenterData, MessageCenterListItem } from "../../../lib/messageCenter";
import { STATUS_LABEL, STATUS_CLASS } from "../../../lib/contactStatus";
import { formatRelativeTime, formatShortDate } from "../../../lib/formatRelative";
import {
  markConversationRead,
  deleteConversation,
  deleteConversations,
  deleteAllConversations,
} from "../../../app/admin/messages/actions";
import { formatPhoneDisplay, phoneTelHref } from "../../../lib/phone";
import { formValueLabel } from "../../../lib/formValueLabels";
import DeleteConfirmModal from "./DeleteConfirmModal";

/** Desktop split-pane still auto-shows the most recent conversation for
 * convenience, matching the CSS breakpoint that switches to the mobile
 * single-column layout (see messageCenter.css). Mobile deliberately
 * shows the list first instead - see handleInitialSelection below. */
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 861px)";

interface Props extends MessageCenterData {
  /** contactId from the /admin/messages/[contactId] route, or null on the plain /admin/messages list route. */
  initialSelectedId: string | null;
}

/** Pretty-prints an inquiry's promoted fields for the detail card. */
function inquiryFieldLines(inquiry: MessageCenterData["detailsByContactId"][string]["inquiries"][number]): string[] {
  const lines: string[] = [];
  if (inquiry.inquiry_type === "puppy_interest" && inquiry.puppy_name) {
    lines.push(`Puppy: ${inquiry.puppy_name}`);
  }
  if (inquiry.inquiry_type === "puppy_reservation") {
    if (inquiry.puppy_name) lines.push(`Puppy: ${inquiry.puppy_name}`);
    if (inquiry.puppy_id) lines.push(`Puppy ID: ${inquiry.puppy_id}`);
    if (inquiry.pickup_or_delivery) lines.push(`Pickup/Delivery: ${inquiry.pickup_or_delivery}`);
  }
  if (inquiry.inquiry_type === "puppy_finder" && inquiry.breed) {
    lines.push(`Breed: ${inquiry.breed}`);
  }
  if (inquiry.inquiry_type === "general" && inquiry.subject) {
    lines.push(`Subject: ${inquiry.subject}`);
  }
  const fd = inquiry.form_data || {};
  if (typeof fd.genderPreference === "string" && fd.genderPreference) {
    lines.push(`Gender preference: ${formValueLabel("genderPreference", fd.genderPreference)}`);
  }
  if (typeof fd.budgetConfirmed === "string" && fd.budgetConfirmed) {
    lines.push(`$1,500+ okay: ${formValueLabel("budgetConfirmed", fd.budgetConfirmed)}`);
  }
  if (typeof fd.timeframe === "string" && fd.timeframe) {
    lines.push(`Timeframe: ${formValueLabel("timeframe", fd.timeframe)}`);
  }
  if (typeof fd.readyForDeposit === "string" && fd.readyForDeposit) {
    lines.push(`Ready for deposit: ${formValueLabel("readyForDeposit", fd.readyForDeposit)}`);
  }
  if (typeof fd.notes === "string" && fd.notes.trim()) {
    lines.push(`Notes: ${fd.notes.trim()}`);
  }
  return lines;
}

const INQUIRY_TYPE_LABEL: Record<string, string> = {
  puppy_interest: "Puppy Interest",
  puppy_finder: "Puppy Finder",
  pypl: "PYPL Registration",
  general: "General Question",
  puppy_reservation: "Puppy Reservation",
};

type PendingDelete = { kind: "single" | "bulk" | "all"; ids: string[] };

export default function MessageCenterClient({ list, detailsByContactId, initialSelectedId }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [localList, setLocalList] = useState<MessageCenterListItem[]>(list);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) setOverflowMenuOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function handleSelect(contactId: string) {
    setSelectedId(contactId);
    router.push(`/admin/messages/${contactId}`);

    const item = localList.find((i) => i.contactId === contactId);
    if (item && item.unreadCount > 0) {
      // Optimistically clear the unread badge immediately, then
      // persist it - no need to block the UI on the round trip.
      setLocalList((prev) =>
        prev.map((i) => (i.contactId === contactId ? { ...i, unreadCount: 0 } : i))
      );
      markConversationRead(contactId);
    }
  }

  function handleBack() {
    setSelectedId(null);
    router.push("/admin/messages");
  }

  function handleRowClick(contactId: string) {
    if (selectionMode) {
      toggleSelected(contactId);
      return;
    }
    handleSelect(contactId);
  }

  function toggleSelected(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  function enterSelectionMode() {
    setSelectionMode(true);
    setSelectedIds(new Set());
  }

  function cancelSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function selectAll() {
    setSelectedIds(new Set(localList.map((i) => i.contactId)));
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const result =
      pendingDelete.kind === "all"
        ? await deleteAllConversations()
        : pendingDelete.ids.length === 1
          ? await deleteConversation(pendingDelete.ids[0])
          : await deleteConversations(pendingDelete.ids);

    setDeleteBusy(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    if (pendingDelete.kind === "all") {
      setLocalList([]);
    } else {
      const deletedIds = new Set(pendingDelete.ids);
      setLocalList((prev) => prev.filter((i) => !deletedIds.has(i.contactId)));
    }

    if (selectedId && (pendingDelete.kind === "all" || pendingDelete.ids.includes(selectedId))) {
      setSelectedId(null);
      router.push("/admin/messages");
    }

    setSelectedIds(new Set());
    setSelectionMode(false);
    setPendingDelete(null);
    setDeleteError(null);
    // revalidatePath inside the server action already marks
    // /admin/messages, /admin/contacts, and /admin/dashboard stale;
    // this makes sure the sidebar's unread badge (rendered by this
    // page's own server component, one level up) picks that up
    // immediately rather than waiting for the next navigation.
    router.refresh();
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  const selectedDetail = selectedId ? detailsByContactId[selectedId] : null;

  useEffect(() => {
    // A direct link (e.g. from Recent Activity or a contact profile)
    // already resolved server-side via initialSelectedId - nothing to do.
    if (initialSelectedId) return;
    if (typeof window === "undefined") return;

    // On the plain /admin/messages list route, preserve the existing
    // desktop convenience of auto-showing the most recent conversation
    // in the split pane. On mobile-width screens, deliberately leave it
    // unselected so the list shows first instead of jumping straight
    // into a conversation.
    if (window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches) {
      setSelectedId(list[0]?.contactId ?? null);
    }
    // Only run once on mount - a one-time default, not meant to fight
    // with the user's subsequent manual selections or react to resizing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (localList.length === 0) {
    return (
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Messages</h1>
          <p className="contacts-subtitle">Every inquiry, in one place.</p>
        </div>
        <div className="contacts-empty">No conversations yet.</div>
      </div>
    );
  }

  return (
    <div className="contacts-page">
      <div className="contacts-page-header msgcenter-page-header">
        <div>
          <h1 className="contacts-title">Messages</h1>
          <p className="contacts-subtitle">
            {localList.reduce((sum, i) => sum + i.unreadCount, 0)} unread
          </p>
        </div>

        <div className="msgcenter-header-actions">
          {selectionMode ? (
            <>
              <button type="button" className="admin-btn" onClick={cancelSelectionMode}>
                Cancel
              </button>
              <button type="button" className="admin-btn" onClick={selectAll}>
                Select All
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={selectedIds.size === 0}
                onClick={() => setPendingDelete({ kind: "bulk", ids: Array.from(selectedIds) })}
              >
                Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </button>
            </>
          ) : (
            <>
              <div className="msgcenter-overflow-wrap" ref={overflowRef}>
                <button
                  type="button"
                  className="admin-btn msgcenter-overflow-btn"
                  aria-label="More actions"
                  onClick={() => setOverflowMenuOpen((v) => !v)}
                >
                  ⋯
                </button>
                {overflowMenuOpen && (
                  <div className="msgcenter-overflow-menu">
                    <button
                      type="button"
                      className="msgcenter-overflow-item danger"
                      onClick={() => {
                        setOverflowMenuOpen(false);
                        setPendingDelete({ kind: "all", ids: [] });
                      }}
                    >
                      Delete All Messages
                    </button>
                  </div>
                )}
              </div>
              <button type="button" className="admin-btn" onClick={enterSelectionMode}>
                Select
              </button>
            </>
          )}
        </div>
      </div>

      <div className="msgcenter">
        <div className={`msgcenter-list-col${selectedId ? " msgcenter-hide-mobile" : ""}`}>
          {localList.map((item) => (
            <div
              key={item.contactId}
              className={`msgcenter-row${selectedId === item.contactId ? " selected" : ""}`}
              onClick={() => handleRowClick(item.contactId)}
              role="button"
              tabIndex={0}
            >
              <div className="msgcenter-row-inner">
                {selectionMode && (
                  <span
                    className={`msgcenter-row-checkbox${selectedIds.has(item.contactId) ? " checked" : ""}`}
                    aria-hidden="true"
                  />
                )}
                <div className="msgcenter-row-content">
                  <div className="msgcenter-row-top">
                    <span className={`msgcenter-row-name${item.unreadCount > 0 ? " unread" : ""}`}>
                      {item.contactName}
                    </span>
                    <span className="msgcenter-row-time">{formatRelativeTime(item.lastActivityAt)}</span>
                  </div>
                  <div className="msgcenter-row-source">{item.sources.join(" · ")}</div>
                  <div className="msgcenter-row-badges">
                    {item.badges.map((badge) => (
                      <span key={badge.key} className="contacts-badge">
                        {badge.icon} {badge.label}
                      </span>
                    ))}
                  </div>
                  <div className="msgcenter-row-bottom">
                    <span className={`contacts-status contacts-status--${STATUS_CLASS[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="msgcenter-lead-score">Score {item.leadScore}</span>
                      {item.unreadCount > 0 && (
                        <span className="msgcenter-unread-count">{item.unreadCount}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`msgcenter-detail-col${!selectedId ? " msgcenter-hide-mobile" : ""}`}>
          {!selectedDetail ? (
            <div className="msgcenter-empty-state">Select a conversation to view it.</div>
          ) : (
            <>
              <div className="msgcenter-thread-col">
                <button type="button" className="msgcenter-back-btn" onClick={handleBack}>
                  ← Back to Messages
                </button>

                <div className="msgcenter-thread-header">
                  <div className="msgcenter-thread-header-row">
                    <div>
                      <div className="msgcenter-thread-name">
                        <Link href={`/admin/contacts/${selectedDetail.contact.id}`}>
                          {selectedDetail.contact.display_name ||
                            `${selectedDetail.contact.first_name} ${selectedDetail.contact.last_name || ""}`.trim()}
                        </Link>
                      </div>
                      <div className="msgcenter-thread-sub">
                        {phoneTelHref(selectedDetail.contact.phone) ? (
                          <a href={phoneTelHref(selectedDetail.contact.phone)!} className="msgcenter-tel-link">
                            {formatPhoneDisplay(selectedDetail.contact.phone)}
                          </a>
                        ) : (
                          selectedDetail.contact.phone || "No phone"
                        )}{" "}
                        · {selectedDetail.contact.email || "No email"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => setPendingDelete({ kind: "single", ids: [selectedDetail.contact.id] })}
                    >
                      Delete Conversation
                    </button>
                  </div>
                </div>

                <div className="msgcenter-section-title">Inquiries</div>
                {selectedDetail.inquiries.map((inquiry, idx) => (
                  <div key={inquiry.id} className="msgcenter-inquiry-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="msgcenter-inquiry-type">
                        {idx === 0 ? "Original: " : ""}
                        {INQUIRY_TYPE_LABEL[inquiry.inquiry_type] || inquiry.inquiry_type}
                      </span>
                      <span className="msgcenter-inquiry-time">
                        {formatShortDate(inquiry.created_at)}
                      </span>
                    </div>
                    <div className="msgcenter-inquiry-fields">
                      {inquiryFieldLines(inquiry).map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="msgcenter-section-title">Conversation</div>
                {selectedDetail.messages.length === 0 ? (
                  <p className="contacts-muted">No messages yet.</p>
                ) : (
                  selectedDetail.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`msgcenter-message-bubble ${msg.direction === "outbound" ? "outbound" : ""}`}
                    >
                      <div className="msgcenter-message-meta">
                        <span>
                          {msg.direction === "inbound" ? "Customer" : "Staff"}
                          {msg.channel ? ` · ${msg.channel.replace("_", " ")}` : ""}
                          {msg.status && msg.status !== "logged" ? ` · ${msg.status.replace("_", " ")}` : ""}
                        </span>
                        <span>{formatRelativeTime(msg.created_at)}</span>
                      </div>
                      <div className="msgcenter-message-body">{msg.body}</div>
                    </div>
                  ))
                )}

                {selectedDetail.timelineEvents.length > 0 && (
                  <>
                    <div className="msgcenter-section-title">Timeline</div>
                    <ul className="profile-timeline">
                      {selectedDetail.timelineEvents.map((event) => (
                        <li key={event.id} className="profile-timeline-item">
                          <span className="profile-timeline-dot" aria-hidden="true" />
                          <div>
                            <div className="profile-timeline-desc">
                              {event.description || event.event_type}
                            </div>
                            <div className="profile-timeline-time">
                              {formatRelativeTime(event.created_at)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {selectedDetail.notes.length > 0 && (
                  <>
                    <div className="msgcenter-section-title">Notes</div>
                    {selectedDetail.notes.map((note) => (
                      <div key={note.id} className="profile-note-item">
                        <div className="profile-note-body">{note.body}</div>
                        <div className="msgcenter-inquiry-time">
                          {note.created_by || "Staff"} · {formatRelativeTime(note.created_at)}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="msgcenter-summary-col">
                <div className="msgcenter-section-title" style={{ marginTop: 0 }}>
                  Contact Summary
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <span className={`contacts-status contacts-status--${STATUS_CLASS[selectedDetail.contact.status]}`}>
                    {STATUS_LABEL[selectedDetail.contact.status]}
                  </span>
                </div>
                <div className="msgcenter-inquiry-fields">
                  <div>Lead score: {selectedDetail.contact.lead_score}</div>
                  <div>
                    Interest level: {selectedDetail.contact.interest_level || "Not set"}
                  </div>
                  <div>
                    City/State: {[selectedDetail.contact.city, selectedDetail.contact.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                  <div>
                    Next follow-up: {formatShortDate(selectedDetail.contact.next_follow_up_at)}
                  </div>
                </div>
                <div className="msgcenter-row-badges" style={{ marginTop: "12px" }}>
                  {selectedDetail.badges.map((badge) => (
                    <span key={badge.key} className="contacts-badge">
                      {badge.icon} {badge.label}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: "16px" }}>
                  <Link
                    href={`/admin/contacts/${selectedDetail.contact.id}`}
                    className="contacts-back-link"
                  >
                    View full profile →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {pendingDelete && (
        <DeleteConfirmModal
          title={
            pendingDelete.kind === "all"
              ? "Delete all messages?"
              : `Delete ${pendingDelete.ids.length} conversation${pendingDelete.ids.length === 1 ? "" : "s"}?`
          }
          body={
            pendingDelete.kind === "all"
              ? "This will permanently delete all conversations and messages from the Message Center. This action cannot be undone."
              : "This will permanently delete the selected conversations and their messages. This action cannot be undone."
          }
          confirmLabel={pendingDelete.kind === "all" ? "Delete All" : "Delete"}
          requireTypedPhrase={pendingDelete.kind === "all" ? "DELETE" : undefined}
          busy={deleteBusy}
          error={deleteError}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
