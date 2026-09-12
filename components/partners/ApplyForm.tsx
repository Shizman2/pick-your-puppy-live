"use client";

import { useState } from "react";
import { submitAffiliateApplication } from "../../app/partners/apply/actions";

export default function ApplyForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [promotionPlan, setPromotionPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await submitAffiliateApplication({
      firstName,
      lastName,
      email,
      phone,
      socialUrl,
      promotionPlan,
      notes,
      website,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="partners-success">
        <div className="partners-success-icon">🐾</div>
        <h2 className="admin-card__title">Application received!</h2>
        <p className="admin-hint">We&apos;ll review it and email you at {email} once it&apos;s been decided.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="inquire-error">{error}</div>}

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">First name</label>
          <input className="admin-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Last name</label>
          <input className="admin-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Email</label>
        <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Phone (optional)</label>
        <input className="admin-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Social media handle or URL (optional)</label>
        <input className="admin-input" value={socialUrl} onChange={(e) => setSocialUrl(e.target.value)} placeholder="@yourhandle or a link" />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">How do you plan to promote us?</label>
        <textarea className="admin-input" rows={3} value={promotionPlan} onChange={(e) => setPromotionPlan(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Anything else? (optional)</label>
        <textarea className="admin-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <button type="submit" className="admin-btn admin-btn--primary" style={{ width: "100%", padding: "12px", marginTop: 8 }} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
