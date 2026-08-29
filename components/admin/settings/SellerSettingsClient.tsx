"use client";

import { useState } from "react";
import { updateSellerPhoneNumber, updateSellerSignatureName } from "../../../app/admin/settings/actions";

interface SellerSettingsClientProps {
  initialPhone: string | null;
  initialSignatureName: string;
}

export default function SellerSettingsClient({ initialPhone, initialSignatureName }: SellerSettingsClientProps) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signatureName, setSignatureName] = useState(initialSignatureName);
  const [savingSignature, setSavingSignature] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);

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

  async function handleSaveSignature() {
    setSignatureError(null);
    setSignatureSaved(false);
    setSavingSignature(true);
    const result = await updateSellerSignatureName(signatureName);
    setSavingSignature(false);
    if (!result.success) {
      setSignatureError(result.error);
      return;
    }
    setSignatureSaved(true);
    setTimeout(() => setSignatureSaved(false), 2500);
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

      <h2 className="admin-card__title" style={{ marginTop: 28 }}>
        Seller Signature
      </h2>
      <p className="admin-hint" style={{ marginBottom: 16 }}>
        Used as the pre-filled Seller Signature on every generated Puppy Document (Bill of Sale, Health Guarantee,
        Refund Policy, Puppy Purchase Acknowledgement) so you don&apos;t have to sign each one by hand.
      </p>

      {signatureError && <div className="settings-error">{signatureError}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Seller Signature Name</label>
        <input
          className="admin-input"
          placeholder="e.g. The Puppy Plugs"
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="admin-btn admin-btn--primary"
        onClick={handleSaveSignature}
        disabled={savingSignature}
      >
        {savingSignature ? "Saving..." : signatureSaved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
