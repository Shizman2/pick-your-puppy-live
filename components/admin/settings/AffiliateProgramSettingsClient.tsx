"use client";

import { useState } from "react";
import { updateAffiliateProgramSettings } from "../../../app/admin/settings/actions";
import type { AffiliateProgramSettingsRow } from "../../../lib/affiliateTypes";

export default function AffiliateProgramSettingsClient({ initial }: { initial: AffiliateProgramSettingsRow }) {
  const [holdDays, setHoldDays] = useState(initial.commission_hold_days.toString());
  const [windowDays, setWindowDays] = useState(initial.attribution_window_days.toString());
  const [type, setType] = useState(initial.default_commission_type);
  const [value, setValue] = useState(
    initial.default_commission_type === "percent_bp" ? (initial.default_commission_value / 100).toString() : (initial.default_commission_value / 100).toString()
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    const result = await updateAffiliateProgramSettings({
      commissionHoldDays: parseInt(holdDays, 10) || 0,
      attributionWindowDays: parseInt(windowDays, 10) || 0,
      defaultCommissionType: type,
      defaultCommissionValue: Math.round(parseFloat(value) * 100),
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="profile-card" style={{ marginBottom: 16 }}>
      <h2 className="admin-card__title">Affiliate Program Settings</h2>
      <p className="admin-hint" style={{ marginBottom: 10 }}>
        These apply going forward only - a click or commission already created keeps the rule that was in effect when it
        happened (see each click/commission's own snapshot).
      </p>
      {error && <div className="inquire-error">{error}</div>}

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Commission hold period (days)</label>
          <input className="admin-input" type="number" value={holdDays} onChange={(e) => setHoldDays(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Attribution window (days)</label>
          <input className="admin-input" type="number" value={windowDays} onChange={(e) => setWindowDays(e.target.value)} />
        </div>
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Default commission type for new affiliates</label>
          <select className="admin-select" value={type} onChange={(e) => setType(e.target.value as "flat_cents" | "percent_bp")}>
            <option value="percent_bp">Percent of sale price</option>
            <option value="flat_cents">Flat amount per sale</option>
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-field__label">{type === "percent_bp" ? "Default percent (%)" : "Default flat amount ($)"}</label>
          <input className="admin-input" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>

      <div className="profile-save-row">
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Affiliate Settings"}
        </button>
        {saved && <span className="admin-hint">Saved.</span>}
      </div>
    </div>
  );
}
