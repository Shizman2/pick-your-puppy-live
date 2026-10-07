"use client";

import { useState } from "react";

interface DeleteConfirmModalProps {
  title: string;
  body: string;
  confirmLabel: string;
  /** When set, Delete/Delete All stays disabled until the admin types this exact phrase - the extra safety gate for "Delete All Messages", matching the existing "type DELETE to confirm" pattern already used for Contact Profile's "Delete Everything Related" (components/admin/contacts/ContactProfileClient.tsx). */
  requireTypedPhrase?: string;
  busy: boolean;
  /** Button text while busy - defaults to "Deleting…" (Message Center). */
  busyLabel?: string;
  /** "danger" (default, red) for destructive deletes; "primary" for reversible actions like Archive/Restore. */
  tone?: "danger" | "primary";
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Small reusable confirm/deny dialog for the Message Center's three
 * destructive actions (delete one, delete selected, delete all). There
 * was no existing modal/dialog component anywhere in components/admin
 * to reuse (only window.confirm/alert, which can't render custom button
 * labels or a visibly-destructive style) - this fills that gap using
 * the same visual language already established elsewhere in admin
 * (.admin-btn/.admin-btn--danger/.admin-input/.admin-field__label, all
 * from app/globals.css) rather than inventing new styles.
 */
export default function DeleteConfirmModal({
  title,
  body,
  confirmLabel,
  requireTypedPhrase,
  busy,
  busyLabel = "Deleting…",
  tone = "danger",
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");

  const confirmDisabled = busy || (requireTypedPhrase ? typedPhrase !== requireTypedPhrase : false);

  return (
    <div className="msgcenter-modal-backdrop" onClick={onCancel}>
      <div className="msgcenter-modal-card" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="msgcenter-modal-title">{title}</div>
        <p className="msgcenter-modal-body">{body}</p>

        {requireTypedPhrase && (
          <div style={{ marginTop: 12 }}>
            <label className="admin-field__label">Type {requireTypedPhrase} to confirm</label>
            <input
              type="text"
              className="admin-input"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={requireTypedPhrase}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        {error && (
          <p className="admin-hint" style={{ color: "var(--color-accent)" }}>
            {error}
          </p>
        )}

        <div className="msgcenter-modal-actions">
          <button type="button" className="admin-btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`admin-btn ${tone === "danger" ? "admin-btn--danger" : "admin-btn--primary"}`}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
