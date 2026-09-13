"use client";

import { useState } from "react";
import Link from "next/link";
import { submitAffiliateApplication } from "../../app/(public)/partners/apply/actions";
import "../../styles/public-tokens.css";
import "./applySuccess.css";

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
      <section id="apply-form" className="affiliate-success-shell">
        <div className="affiliate-success-card">
          <div className="affiliate-success-icon-wrap">
            <span className="affiliate-success-spark affiliate-success-spark--tl" aria-hidden="true" />
            <span className="affiliate-success-spark affiliate-success-spark--tr" aria-hidden="true" />
            <span className="affiliate-success-spark affiliate-success-spark--l" aria-hidden="true" />
            <span className="affiliate-success-spark affiliate-success-spark--r" aria-hidden="true" />
            <span className="affiliate-success-spark affiliate-success-spark--bl" aria-hidden="true" />
            <div className="affiliate-success-circle">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <ellipse cx="6.5" cy="9.5" rx="2.1" ry="2.6" transform="rotate(-15 6.5 9.5)" />
                <ellipse cx="10.8" cy="6.2" rx="2.1" ry="2.7" />
                <ellipse cx="15.2" cy="6.2" rx="2.1" ry="2.7" />
                <ellipse cx="19.3" cy="9.5" rx="2.1" ry="2.6" transform="rotate(15 19.3 9.5)" />
                <path d="M12.9 11.2c-3.6 0-6.4 2.7-6.4 5.6 0 2.1 1.7 3.4 3.6 3.4 1.1 0 1.9-.4 2.8-.4s1.7.4 2.8.4c1.9 0 3.6-1.3 3.6-3.4 0-2.9-2.8-5.6-6.4-5.6z" />
              </svg>
            </div>
          </div>

          <h1 className="affiliate-success-title">Application Received</h1>
          <p className="affiliate-success-lead">
            Thanks for your interest in partnering with
            <br />
            The Puppy Plugs.
          </p>
          <p className="affiliate-success-sub">We review every application and will reach out to you by email.</p>

          <Link href="/" className="affiliate-success-button">
            Back to Homepage
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="apply-form" className="partner-apply-section">
      <div className="partner-apply-card">
        <h2 className="partner-section-title">Become an Affiliate</h2>
        <p className="partner-section-sub">Fill out the form below and we&apos;ll be in touch soon!</p>

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

          {/*
            Honeypot - real applicants never see or fill this in. Hidden with
            display:none (not off-screen positioning): off-screen-but-rendered
            inputs are frequently filled by browser autofill/password-manager
            "fill form" features, which was silently tripping this for real
            applicants and making a genuine submission look successful while
            never reaching the database. display:none is skipped by autofill.
          */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <button type="submit" className="partner-apply-submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
