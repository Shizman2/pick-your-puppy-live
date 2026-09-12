"use client";

import { useState } from "react";
import { updateMyPayoutInfo } from "../../app/partners/profile/actions";
import { PAYOUT_METHOD_OPTIONS, PAYOUT_METHOD_LABEL, type AffiliateRow, type AffiliatePayoutMethod } from "../../lib/affiliateTypes";

export default function MyProfileForm({ affiliate }: { affiliate: AffiliateRow }) {
  const [method, setMethod] = useState<AffiliatePayoutMethod | "">(affiliate.payout_method || "");
  const [handle, setHandle] = useState(affiliate.payout_handle || "");
  const [phone, setPhone] = useState(affiliate.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    const result = await updateMyPayoutInfo({ method: method || null, handle, phone });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="profile-card" style={{ maxWidth: 480 }}>
      <p className="admin-hint">
        {affiliate.email} · Commission: {affiliate.commission_type === "flat_cents"
          ? `$${((affiliate.commission_flat_cents || 0) / 100).toFixed(2)} per sale`
          : `${((affiliate.commission_percent_bp || 0) / 100).toFixed(1)}% of sale price`}
      </p>

      <h2 className="admin-card__title" style={{ marginTop: 16 }}>
        Payout Info
      </h2>
      {error && <div className="inquire-error">{error}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Phone</label>
        <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Preferred payout method</label>
        <select className="admin-select" value={method} onChange={(e) => setMethod(e.target.value as AffiliatePayoutMethod)}>
          <option value="">Not set</option>
          {PAYOUT_METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {PAYOUT_METHOD_LABEL[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Handle (cashtag, email, phone...)</label>
        <input className="admin-input" value={handle} onChange={(e) => setHandle(e.target.value)} />
      </div>

      <div className="profile-save-row">
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="admin-hint">Saved.</span>}
      </div>
    </div>
  );
}
