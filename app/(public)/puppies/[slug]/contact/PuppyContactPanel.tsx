"use client";

import { useState } from "react";
import { trackCta } from "../../../../../lib/analytics/trackClient";

// Call + message area of the puppy contact page. Submitting reuses the
// existing website inquiry backend (/api/inquire, inquiryType
// "puppy_interest" - the same request the old I'm Interested form sent), and
// only switches this same page to the Thanks state after that request
// reports the inquiry was saved. Other contact channels (e.g. WhatSnap) can
// be added as another option alongside the call button later.

// Real 24h views below this are not shown at all (display threshold only -
// the number shown is always the real count).
const VIEW_BADGE_THRESHOLD = 10;

function formatPhone(digits: string) {
  const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : digits;
}

function PhoneIcon({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function PuppyContactPanel({
  puppyId,
  puppyName,
  breed,
  slug,
  phone,
  views24h,
}: {
  puppyId: string;
  puppyName: string;
  breed: string;
  slug: string;
  phone: string | null;
  views24h: number;
}) {
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, same as the existing form
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const digits = (phone || "").replace(/\D/g, "");
  const telDigits = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : digits;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    if (!name.trim() || !phoneInput.trim()) {
      setError("Please add your name and phone number.");
      return;
    }
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "puppy_interest",
          firstName: name.trim(),
          phone: phoneInput.trim(),
          email: email.trim(),
          notes: message.trim(),
          consentToContact: true,
          smsInquiryConsent: false,
          smsMarketingConsent: false,
          website,
          puppyId,
          puppyName,
          breed,
          puppySlug: slug,
          sourceUrl: typeof window !== "undefined" ? window.location.href : `/puppies/${slug}/contact`,
          source: "Puppy Contact Page",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("success");
        // Bring the confirmation into view (it replaces the form in place).
        requestAnimationFrame(() =>
          document.querySelector(".contact-success")?.scrollIntoView({ behavior: "smooth", block: "center" })
        );
        return;
      }
      setError(data.error || "We couldn't send your message. Please try again.");
      setStatus("idle");
    } catch {
      setError("We couldn't send your message. Please check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-success" role="status">
        <div className="contact-success-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="contact-success-title">Thanks!</h2>
        <p className="contact-success-text">
          We received your message about {puppyName}!
          <br />
          We&rsquo;ll get back to you as soon as possible.
        </p>
        <a className="contact-success-back" href={`/puppies/${slug}`}>
          ← Back to {puppyName}&rsquo;s Listing
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="contact-card">
        <h2 className="contact-question">How would you like to contact us about {puppyName}?</h2>
        {telDigits && (
          <a className="contact-call-btn" href={`tel:${telDigits}`} onClick={() => trackCta("call_now", puppyId)}>
            <PhoneIcon />
            <span className="contact-call-text">
              <span className="contact-call-label">Call About {puppyName}</span>
              <span className="contact-call-number">{formatPhone(digits)}</span>
            </span>
          </a>
        )}
        {views24h >= VIEW_BADGE_THRESHOLD && (
          <div className="contact-views">
            <span className="contact-views-dot" aria-hidden="true" />
            Viewed {views24h} times in the last 24 hours
          </div>
        )}
      </div>

      {telDigits && (
        <div className="contact-or" aria-hidden="true">
          <span />
          OR
          <span />
        </div>
      )}

      <form className="contact-card contact-form" onSubmit={handleSubmit} noValidate>
        <div className="contact-form-head">
          <span className="contact-form-icon" aria-hidden="true">
            💬
          </span>
          <div>
            <h2 className="contact-form-title">Send Us a Message About {puppyName}</h2>
            <p className="contact-form-sub">We&rsquo;ll get back to you as soon as possible!</p>
          </div>
        </div>

        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: "absolute", left: "-9999px" }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <label className="contact-field">
          <span className="contact-field-label">
            Your Name <span className="contact-req">*</span>
          </span>
          <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="contact-field">
          <span className="contact-field-label">
            Phone Number <span className="contact-req">*</span>
          </span>
          <input type="tel" autoComplete="tel" inputMode="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
        </label>
        <label className="contact-field">
          <span className="contact-field-label">Email (optional)</span>
          <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="contact-field">
          <span className="contact-field-label">Message (optional)</span>
          <textarea
            rows={3}
            placeholder={`Any questions about ${puppyName}?`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {error && (
          <div className="contact-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="contact-send-btn" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : "Send Message"}
        </button>
      </form>
    </>
  );
}
