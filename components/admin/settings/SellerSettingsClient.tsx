"use client";

import { useState } from "react";
import { updateSellerPhoneNumber } from "../../../app/admin/settings/actions";

export default function SellerSettingsClient({ initialPhone }: { initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    const result = await updateSellerPhoneNumber(phone);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="profile-card">
      <h2 className="admin-card__title">Seller Contact</h2>
      <p className="admin-hint" style={{ marginBottom: 16 }}>
        This number powers the &quot;Call the Seller&quot; button on every puppy detail page. Leave it blank to hide
        that button until you&apos;re ready.
      </p>

      {error && <div className="settings-error">{error}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Seller Phone Number</label>
        <input
          className="admin-input"
          type="tel"
          placeholder="e.g. (267) 774-3553"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
