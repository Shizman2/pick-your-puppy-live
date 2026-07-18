"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MessageCenterData, MessageCenterListItem } from "../../../lib/messageCenter";
import { STATUS_LABEL, STATUS_CLASS } from "../../../lib/contactStatus";
import { formatRelativeTime, formatShortDate } from "../../../lib/formatRelative";
import { markConversationRead } from "../../../app/admin/messages/actions";

interface Props extends MessageCenterData {}

/** Pretty-prints an inquiry's promoted fields for the detail card. */
function inquiryFieldLines(inquiry: MessageCenterData["detailsByContactId"][string]["inquiries"][number]): string[] {
  const lines: string[] = [];
  if (inquiry.inquiry_type === "puppy_interest" && inquiry.puppy_name) {
    lines.push(`Puppy: ${inquiry.puppy_name}`);
  }
  if (inquiry.inquiry_type === "puppy_finder" && inquiry.breed) {
    lines.push(`Breed: ${inquiry.breed}`);
  }
  if (inquiry.inquiry_type === "general" && inquiry.subject) {
    lines.push(`Subject: ${inquiry.subject}`);
  }
  const fd = inquiry.form_data || {};
  if (typeof fd.genderPreference === "string" && fd.genderPreference) {
    lines.push(`Gender preference: ${fd.genderPreference}`);
  }
  if (typeof fd.budgetConfirmed === "string" && fd.budgetConfirmed) {
    lines.push(`$1,500+ okay: ${fd.budgetConfirmed === "yes" ? "Yes" : "No"}`);
  }
  if (typeof fd.timeframe === "string" && fd.timeframe) {
    lines.push(`Timeframe: ${fd.timeframe}`);
  }
  if (typeof fd.readyForDeposit === "string" && fd.readyForDeposit) {
    lines.push(`Ready for deposit: ${fd.readyForDeposit.replace("_", " ")}`);
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
};

export default function MessageCenterClient({ list, detailsByContactId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.contactId ?? null);
  const [localList, setLocalList] = useState<MessageCenterListItem[]>(list);

  function handleSelect(contactId: string) {
    setSelectedId(contactId);

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

  const selectedDetail = selectedId ? detailsByContactId[selectedId] : null;

  useEffect(() => {
    const hashId = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hashId && detailsByContactId[hashId]) {
      handleSelect(hashId);
    }
    // Only run once on mount - this is meant to catch the initial
    // deep link, not fight with subsequent manual selections.
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
      <div className="contacts-page-header">
        <h1 className="contacts-title">Messages</h1>
        <p className="contacts-subtitle">
          {list.reduce((sum, i) => sum + i.unreadCount, 0)} unread
        </p>
      </div>

      <div className="msgcenter">
        <div className={`msgcenter-list-col${selectedId ? " msgcenter-hide-mobile" : ""}`}>
          {localList.map((item) => (
            <div
              key={item.contactId}
              className={`msgcenter-row${selectedId === item.contactId ? " selected" : ""}`}
              onClick={() => handleSelect(item.contactId)}
              role="button"
              tabIndex={0}
            >
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
          ))}
        </div>

        <div className={`msgcenter-detail-col${!selectedId ? " msgcenter-hide-mobile" : ""}`}>
          {!selectedDetail ? (
            <div className="msgcenter-empty-state">Select a conversation to view it.</div>
          ) : (
            <>
              <div className="msgcenter-thread-col">
                <button
                  type="button"
                  className="msgcenter-back-btn"
                  onClick={() => setSelectedId(null)}
                >
                  ← Back to Messages
                </button>

                <div className="msgcenter-thread-header">
                  <div className="msgcenter-thread-name">
                    <Link href={`/admin/contacts/${selectedDetail.contact.id}`}>
                      {selectedDetail.contact.display_name ||
                        `${selectedDetail.contact.first_name} ${selectedDetail.contact.last_name || ""}`.trim()}
                    </Link>
                  </div>
                  <div className="msgcenter-thread-sub">
                    {selectedDetail.contact.phone || "No phone"} ·{" "}
                    {selectedDetail.contact.email || "No email"}
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
    </div>
  );
}
