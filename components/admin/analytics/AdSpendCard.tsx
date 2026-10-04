"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAdSpendEntry, updateAdSpendEntry, deleteAdSpendEntry } from "../../../app/admin/analytics/adSpendActions";
import { AD_SPEND_PLATFORM_OPTIONS, AD_SPEND_PLATFORM_LABEL, type AdSpendEntryRow, type AdSpendPlatform } from "../../../lib/adSpendTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * V1 manual ad spend logging (no Meta/Google API integration) - see the
 * approved Q4 Business Scorecard audit. Rendered on BOTH Admin ->
 * Analytics and the Business Dashboard's Marketing Performance section
 * (the primary place an owner expects to log advertising expenses, per
 * the Job 2 Financial Correction) - same component, same server
 * actions, no duplicated management system.
 */
export default function AdSpendCard({ entries }: { entries: AdSpendEntryRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(todayDateInput());
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState<AdSpendPlatform>("meta");
  const [campaign, setCampaign] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setDate(todayDateInput());
    setAmount("");
    setPlatform("meta");
    setCampaign("");
    setNote("");
    setError(null);
  }

  function handleStartEdit(entry: AdSpendEntryRow) {
    setError(null);
    setShowForm(true);
    setEditingId(entry.id);
    setDate(entry.spend_date.slice(0, 10));
    setAmount((entry.amount_cents / 100).toString());
    setPlatform(entry.platform);
    setCampaign(entry.campaign_name || "");
    setNote(entry.note || "");
  }

  async function handleSave() {
    setError(null);
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    const result = editingId
      ? await updateAdSpendEntry(editingId, date, amountNum, platform, campaign, note)
      : await addAdSpendEntry(date, amountNum, platform, campaign, note);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    resetForm();
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ad spend entry?")) return;
    setDeletingId(id);
    await deleteAdSpendEntry(id);
    setDeletingId(null);
    if (editingId === id) {
      resetForm();
      setShowForm(false);
    }
    router.refresh();
  }

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Ad Spend</div>
        <button
          type="button"
          className="dash2-goal-edit-btn"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "+ Log Spend"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: 16 }}>
          {error && <div className="inquire-error">{error}</div>}
          <div className="puppy-form-row">
            <div className="admin-field">
              <label className="admin-field__label">Date</label>
              <input className="admin-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-field__label">Amount ($)</label>
              <input className="admin-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Platform</label>
            <select className="admin-select" value={platform} onChange={(e) => setPlatform(e.target.value as AdSpendPlatform)}>
              {AD_SPEND_PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {AD_SPEND_PLATFORM_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Campaign (optional)</label>
            <input className="admin-input" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. Q4 evergreen funnel" />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Note (optional)</label>
            <input className="admin-input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save Entry"}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-btn"
                disabled={saving}
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="analytics-empty">No ad spend logged yet.</p>
      ) : (
        <div className="analytics-table-list">
          {entries.map((e) => (
            <div key={e.id} className="analytics-table-row">
              <div className="analytics-table-label">
                {AD_SPEND_PLATFORM_LABEL[e.platform]}
                {e.campaign_name ? ` · ${e.campaign_name}` : ""}
                <span className="analytics-table-label-sub">
                  {e.spend_date}
                  {e.note ? ` · ${e.note}` : ""}
                </span>
              </div>
              <div className="analytics-table-metric">
                <div className="analytics-table-metric-value">{formatPriceFromCents(e.amount_cents)}</div>
              </div>
              <button type="button" className="analytics-adspend-edit" onClick={() => handleStartEdit(e)} aria-label="Edit entry">
                ✎
              </button>
              <button
                type="button"
                className="analytics-adspend-delete"
                onClick={() => handleDelete(e.id)}
                disabled={deletingId === e.id}
                aria-label="Delete entry"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
