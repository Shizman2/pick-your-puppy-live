"use client";

import { useState, useTransition } from "react";
import type { ContactProfileData, ContactStatus, InterestLevel } from "../../../lib/contactTypes";
import { STATUS_LABEL } from "../../../lib/contactStatus";
import { formatRelativeTime, formatShortDate } from "../../../lib/formatRelative";
import { updateContactStatus, addContactNote } from "../../../app/admin/contacts/actions";

const STATUS_OPTIONS: ContactStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "reserved",
  "customer",
  "closed",
];

const INTEREST_LEVEL_OPTIONS: { value: InterestLevel | ""; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function contactDisplayName(profile: ContactProfileData): string {
  const { contact } = profile;
  if (contact.display_name && contact.display_name.trim()) return contact.display_name;
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

/** Converts an ISO timestamp to the yyyy-MM-dd a <input type="date"> needs. */
function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function ContactProfileClient({ profile }: { profile: ContactProfileData }) {
  const { contact } = profile;

  const [status, setStatus] = useState<ContactStatus>(contact.status);
  const [interestLevel, setInterestLevel] = useState<InterestLevel | "">(
    contact.interest_level || ""
  );
  const [nextFollowUp, setNextFollowUp] = useState(toDateInputValue(contact.next_follow_up_at));
  const [closedReason, setClosedReason] = useState(contact.closed_reason || "");

  const [noteBody, setNoteBody] = useState("");
  const [notes, setNotes] = useState(profile.notes);

  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  function handleSaveStatus() {
    startTransition(async () => {
      try {
        await updateContactStatus(contact.id, {
          status,
          interest_level: interestLevel || null,
          next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
          closed_reason: closedReason.trim() || null,
        });
        setSavedMessage("Saved.");
      } catch (err) {
        setSavedMessage(err instanceof Error ? err.message : "Couldn't save.");
      }
    });
  }

  function handleAddNote() {
    const trimmed = noteBody.trim();
    if (!trimmed) return;

    setNoteError(null);
    startTransition(async () => {
      try {
        await addContactNote(contact.id, trimmed);
        // Optimistic local update so the note shows up immediately
        // without waiting on a full server round-trip re-fetch.
        setNotes((prev) => [
          { id: `temp-${Date.now()}`, contact_id: contact.id, author: "You", body: trimmed, created_at: new Date().toISOString() },
          ...prev,
        ]);
        setNoteBody("");
      } catch (err) {
        setNoteError(err instanceof Error ? err.message : "Couldn't save note.");
      }
    });
  }

  return (
    <div className="profile">
      {/* Header */}
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h1 className="contacts-title">{contactDisplayName(profile)}</h1>
            <p className="contacts-subtitle">
              {[contact.city, contact.state].filter(Boolean).join(", ") || "No location on file"}
            </p>
          </div>
          {contact.needs_duplicate_review && (
            <span className="contacts-flag" title="Possible duplicate - needs review">
              ⚠️ Needs duplicate review
            </span>
          )}
        </div>

        <div className="profile-info-grid">
          <div>
            <span className="profile-info-label">Phone</span>
            <span className="profile-info-value">{contact.phone || "—"}</span>
          </div>
          <div>
            <span className="profile-info-label">Email</span>
            <span className="profile-info-value">{contact.email || "—"}</span>
          </div>
          <div>
            <span className="profile-info-label">Source</span>
            <span className="profile-info-value">{contact.source || "—"}</span>
          </div>
          <div>
            <span className="profile-info-label">Lead Score</span>
            <span className="profile-info-value">{contact.lead_score}/100</span>
          </div>
        </div>

        {profile.badges.length > 0 && (
          <div className="contacts-cell--badges" style={{ marginTop: 14 }}>
            {profile.badges.map((badge) => (
              <span className="contacts-badge" key={badge.key}>
                <span aria-hidden="true">{badge.icon}</span> {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Editable status controls */}
      <div className="profile-card">
        <h2 className="admin-card__title">Status &amp; Next Steps</h2>

        <div className="profile-status-grid">
          <div className="admin-field">
            <label className="admin-field__label">Status</label>
            <select
              className="admin-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-field__label">Interest Level</label>
            <select
              className="admin-select"
              value={interestLevel}
              onChange={(e) => setInterestLevel(e.target.value as InterestLevel | "")}
            >
              {INTEREST_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-field__label">Next Follow-up</label>
            <input
              type="date"
              className="admin-input"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
            />
          </div>
        </div>

        {status === "closed" && (
          <div className="admin-field">
            <label className="admin-field__label">Closed Reason</label>
            <textarea
              className="admin-textarea"
              value={closedReason}
              onChange={(e) => setClosedReason(e.target.value)}
              placeholder="Why was this contact closed?"
            />
          </div>
        )}

        <div className="profile-save-row">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSaveStatus}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {savedMessage && <span className="admin-hint">{savedMessage}</span>}
        </div>
      </div>

      {/* Messages placeholder - intentionally not a real conversation
          UI. The Message Center (next checkpoint) is where
          conversations actually happen; this just links out to it. */}
      <div className="profile-card">
        <h2 className="admin-card__title">Messages</h2>
        <p className="admin-hint" style={{ marginBottom: 0 }}>
          {profile.unreadCount > 0
            ? `${profile.unreadCount} unread message${profile.unreadCount === 1 ? "" : "s"}. `
            : "No unread messages. "}
          Message Center coming in the next checkpoint.
        </p>
      </div>

      {/* Timeline */}
      <div className="profile-card">
        <h2 className="admin-card__title">Timeline</h2>
        {profile.timelineEvents.length === 0 ? (
          <p className="contacts-muted">Nothing logged yet.</p>
        ) : (
          <ul className="profile-timeline">
            {profile.timelineEvents.map((event) => (
              <li key={event.id} className="profile-timeline-item">
                <span className="profile-timeline-dot" aria-hidden="true" />
                <div>
                  <p className="profile-timeline-desc">
                    {event.description || event.event_type.replace(/_/g, " ")}
                  </p>
                  <span className="profile-timeline-time">
                    {formatShortDate(event.created_at)} · {formatRelativeTime(event.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      <div className="profile-card">
        <h2 className="admin-card__title">Notes</h2>

        <div className="admin-field">
          <textarea
            className="admin-textarea"
            placeholder="Add a note about this contact…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
        </div>
        <div className="profile-save-row">
          <button
            type="button"
            className="admin-btn"
            onClick={handleAddNote}
            disabled={isPending || !noteBody.trim()}
          >
            Add Note
          </button>
          {noteError && <span className="admin-hint">{noteError}</span>}
        </div>

        {notes.length > 0 && (
          <ul className="profile-notes" style={{ marginTop: 14 }}>
            {notes.map((note) => (
              <li key={note.id} className="profile-note-item">
                <p className="profile-note-body">{note.body}</p>
                <span className="profile-timeline-time">
                  {note.author || "Staff"} · {formatRelativeTime(note.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
