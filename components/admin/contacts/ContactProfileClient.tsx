"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContactProfileData, ContactStatus, InterestLevel } from "../../../lib/contactTypes";
import { STATUS_LABEL } from "../../../lib/contactStatus";
import { formatRelativeTime, formatShortDate } from "../../../lib/formatRelative";
import { formatPhoneDisplay, phoneTelHref } from "../../../lib/phone";
import {
  updateContactStatus,
  addContactNote,
  archiveContact,
  deleteContactCompletely,
  updateContactAddress,
} from "../../../app/admin/contacts/actions";
import ContactActivities from "./ContactActivities";
import PuppyFinderProposalsCard from "./PuppyFinderProposalsCard";

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
  const router = useRouter();

  const [status, setStatus] = useState<ContactStatus>(contact.status);
  const [interestLevel, setInterestLevel] = useState<InterestLevel | "">(
    contact.interest_level || ""
  );
  const [nextFollowUp, setNextFollowUp] = useState(toDateInputValue(contact.next_follow_up_at));
  const [closedReason, setClosedReason] = useState(contact.closed_reason || "");

  const [noteBody, setNoteBody] = useState("");
  const [notes, setNotes] = useState(profile.notes);

  const [addrCity, setAddrCity] = useState(contact.city || "");
  const [addrState, setAddrState] = useState(contact.state || "");
  const [addrStreet, setAddrStreet] = useState(contact.address || "");
  const [addrZip, setAddrZip] = useState(contact.zip || "");
  const [addressSaved, setAddressSaved] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteAllPanel, setShowDeleteAllPanel] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);

  function handleSaveStatus() {
    startTransition(async () => {
      const result = await updateContactStatus(contact.id, {
        status,
        interest_level: interestLevel || null,
        next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
        closed_reason: closedReason.trim() || null,
      });
      setSavedMessage(result.success ? "Saved." : result.error);
    });
  }

  function handleAddNote() {
    const trimmed = noteBody.trim();
    if (!trimmed) return;

    setNoteError(null);
    startTransition(async () => {
      const result = await addContactNote(contact.id, trimmed);
      if (!result.success) {
        setNoteError(result.error);
        return;
      }
      // Optimistic local update so the note shows up immediately
      // without waiting on a full server round-trip re-fetch.
      setNotes((prev) => [
        { id: `temp-${Date.now()}`, contact_id: contact.id, created_by: "You", body: trimmed, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setNoteBody("");
    });
  }

  function handleSaveAddress() {
    startTransition(async () => {
      const result = await updateContactAddress(contact.id, {
        city: addrCity,
        state: addrState,
        address: addrStreet,
        zip: addrZip,
      });
      setAddressSaved(result.success ? "Saved." : result.error);
    });
  }

  async function handleArchiveContact() {
    if (
      !confirm("Delete this contact? Related sales and historical business records will be preserved.")
    ) {
      return;
    }
    setDangerError(null);
    setIsArchiving(true);
    const result = await archiveContact(contact.id);
    setIsArchiving(false);
    if (!result.success) {
      setDangerError(result.error);
      return;
    }
    router.push("/admin/contacts");
  }

  async function handleDeleteEverything() {
    if (deleteAllConfirmText !== "DELETE") return;
    setDangerError(null);
    setIsDeletingAll(true);
    const result = await deleteContactCompletely(contact.id);
    setIsDeletingAll(false);
    if (!result.success) {
      setDangerError(result.error);
      return;
    }
    router.push("/admin/contacts");
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
            <span className="profile-info-value">
              {phoneTelHref(contact.phone) ? (
                <a href={phoneTelHref(contact.phone)!}>{formatPhoneDisplay(contact.phone)}</a>
              ) : (
                contact.phone || "—"
              )}
            </span>
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

      {/* Mailing address - added for Puppy Documents (the Bill of Sale
          needs a full buyer address), so this is also the one place a
          contact's city/state can be corrected after creation. */}
      <div className="profile-card">
        <h2 className="admin-card__title">Mailing Address</h2>

        <div className="profile-status-grid">
          <div className="admin-field">
            <label className="admin-field__label">Street address</label>
            <input className="admin-input" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">City</label>
            <input className="admin-input" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">State</label>
            <input className="admin-input" value={addrState} onChange={(e) => setAddrState(e.target.value)} />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">ZIP</label>
            <input className="admin-input" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} />
          </div>
        </div>

        <div className="profile-save-row">
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveAddress} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </button>
          {addressSaved && <span className="admin-hint">{addressSaved}</span>}
        </div>
      </div>

      <PuppyFinderProposalsCard
        contactId={contact.id}
        proposals={profile.puppyFinderProposals}
        finderInquiries={profile.puppyFinderInquiries}
      />

      <ContactActivities contactId={contact.id} initialActivities={profile.activities} />

      {/* Links out to the Message Center (built this checkpoint) rather
          than building a second conversation UI on this page. */}
      <div className="profile-card">
        <h2 className="admin-card__title">Messages</h2>
        <p className="admin-hint" style={{ marginBottom: 8 }}>
          {profile.unreadCount > 0
            ? `${profile.unreadCount} unread message${profile.unreadCount === 1 ? "" : "s"}.`
            : "No unread messages."}
        </p>
        <a href={`/admin/messages/${contact.id}`} className="admin-btn">
          Open in Message Center →
        </a>
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
                  {note.created_by || "Staff"} · {formatRelativeTime(note.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Danger Zone */}
      <div className="profile-card profile-danger-zone">
        <h2 className="admin-card__title">Danger Zone</h2>

        <div className="profile-danger-row">
          <div>
            <strong>Delete Contact</strong>
            <p className="admin-hint">
              Archives this contact and removes them from the Contacts list. Sales, payments, and
              historical records are preserved.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={handleArchiveContact}
            disabled={isArchiving}
          >
            {isArchiving ? "Deleting…" : "Delete Contact"}
          </button>
        </div>

        <div className="profile-danger-row">
          <div>
            <strong>Delete Everything Related</strong>
            <p className="admin-hint">
              Permanently deletes this contact along with every message, inquiry, note, Puppy
              Finder proposal, and any linked sale and payments. This can&apos;t be undone. For
              removing fake or test customers only.
            </p>
          </div>
          {!showDeleteAllPanel ? (
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => setShowDeleteAllPanel(true)}
            >
              Delete Everything Related
            </button>
          ) : (
            <div className="profile-danger-confirm">
              <label className="admin-field__label">Type DELETE to confirm</label>
              <input
                type="text"
                className="admin-input"
                value={deleteAllConfirmText}
                onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
              <div className="profile-danger-confirm-actions">
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => {
                    setShowDeleteAllPanel(false);
                    setDeleteAllConfirmText("");
                  }}
                  disabled={isDeletingAll}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={handleDeleteEverything}
                  disabled={deleteAllConfirmText !== "DELETE" || isDeletingAll}
                >
                  {isDeletingAll ? "Deleting…" : "Delete Everything Related"}
                </button>
              </div>
            </div>
          )}
        </div>

        {dangerError && (
          <p className="admin-hint" style={{ color: "var(--color-accent)", marginTop: 10 }}>
            {dangerError}
          </p>
        )}
      </div>
    </div>
  );
}
