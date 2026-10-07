"use client";

import { useState } from "react";
import PhoneInput from "../../../components/PhoneInput";

// Same consent-version constant used by the "I'm Interested" form -
// the disclosure wording here is identical, so this isn't a new
// version of the disclosure, just a second place it's shown.
const CONSENT_VERSION = "a2p_consent_v1";

export default function SmsOptInForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsInquiryConsent, setSmsInquiryConsent] = useState(false);
  const [smsMarketingConsent, setSmsMarketingConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  // Validation hint, or - if the server couldn't save the submission - a
  // plain "not sent" message. The form stays filled in either way.
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      setErrorMsg("Please add your name, and either an email or phone.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "general",
          firstName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: "SMS Opt-In Page",
          // Submitting this form is itself the customer asking to be
          // contacted back - separate from, and not a substitute for,
          // the two explicit SMS opt-ins below. Neither SMS checkbox
          // affects this value, and this value never implies either
          // SMS consent.
          consentToContact: true,
          smsInquiryConsent,
          smsMarketingConsent,
          consentVersion: CONSENT_VERSION,
          website,
          sourceUrl: typeof window !== "undefined" ? window.location.href : "/sms-opt-in",
          source: "SMS Opt-In Page",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.error || "We couldn't send your message. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("We couldn't send your message. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="optin-form-wrap">
        <div className="optin-success">
          <p>🐾 Thanks! Your message preferences have been saved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="optin-form-wrap">
      <form className="optin-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: "absolute", left: "-9999px" }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <input
          type="text"
          name="first_name"
          id="optin-name"
          placeholder="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          name="email"
          id="optin-email"
          placeholder="Your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PhoneInput
          name="phone"
          id="optin-phone"
          placeholder="Your phone"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
        />

        <div className="optin-consent-group">
          <label className="optin-consent-option">
            <input
              type="checkbox"
              name="sms_inquiry_consent"
              id="sms_inquiry_consent"
              value="yes"
              checked={smsInquiryConsent}
              onChange={(e) => setSmsInquiryConsent(e.target.checked)}
            />
            <span className="optin-consent-option-text">
              <span className="optin-consent-label">Puppy Inquiry Texts</span>
              <span className="optin-consent-disclosure">
                I consent to receive non-marketing text messages from The Puppy Plugs, operated by Sean Williams,
                about my puppy inquiry, including responses and service updates. Message frequency may vary. Message
                &amp; data rates may apply. Reply STOP to opt out or HELP for assistance. Consent is not a condition
                of purchase.
              </span>
            </span>
          </label>

          <label className="optin-consent-option">
            <input
              type="checkbox"
              name="sms_marketing_consent"
              id="sms_marketing_consent"
              value="yes"
              checked={smsMarketingConsent}
              onChange={(e) => setSmsMarketingConsent(e.target.checked)}
            />
            <span className="optin-consent-option-text">
              <span className="optin-consent-label">Offers &amp; Puppy Updates</span>
              <span className="optin-consent-disclosure">
                I consent to receive marketing text messages from The Puppy Plugs, operated by Sean Williams, about
                available puppies, special offers, and service updates. Message frequency may vary. Message &amp;
                data rates may apply. Reply STOP to opt out or HELP for assistance. Consent is not a condition of
                purchase.
              </span>
            </span>
          </label>

          <div className="optin-consent-links">
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            <span aria-hidden="true"> &middot; </span>
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms &amp; Conditions
            </a>
          </div>
        </div>

        {status === "error" && <p className="optin-error">{errorMsg}</p>}

        <button type="submit" className="pp-btn-primary" disabled={status === "submitting"}>
          {status === "submitting" ? "Saving..." : "Save Preferences ›"}
        </button>
      </form>
    </div>
  );
}
