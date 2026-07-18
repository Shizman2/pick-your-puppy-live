"use client";

import { useState } from "react";

type InquiryType = "puppy_interest" | "puppy_finder" | "pypl" | "general";

interface InquireFormProps {
  initialType: InquiryType;
  initialPuppyName?: string;
  initialPuppySlug?: string;
}

const TYPE_OPTIONS: { value: InquiryType; label: string }[] = [
  { value: "puppy_interest", label: "I'm interested in a puppy" },
  { value: "puppy_finder", label: "Help me find a puppy" },
  { value: "pypl", label: "Register for Pick Your Puppy Live" },
  { value: "general", label: "I have a general question" },
];

export default function InquireForm({
  initialType,
  initialPuppyName,
  initialPuppySlug,
}: InquireFormProps) {
  const [inquiryType, setInquiryType] = useState<InquiryType>(initialType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Shared fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("phone");
  const [consentToContact, setConsentToContact] = useState(false);
  const [notes, setNotes] = useState("");

  // Puppy interest fields
  const [readyForDeposit, setReadyForDeposit] = useState("not_yet");

  // Puppy finder fields
  const [breed, setBreed] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [deliveryNeeded, setDeliveryNeeded] = useState(false);

  // General fields
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Honeypot - real users never see or fill this
  const [website, setWebsite] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || (!phone.trim() && !email.trim())) {
      setError("Please enter your first name and at least a phone number or email.");
      return;
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      inquiryType,
      firstName,
      lastName,
      phone,
      email,
      city,
      state,
      preferredContactMethod,
      consentToContact,
      notes,
      website, // honeypot
      sourceUrl: typeof window !== "undefined" ? window.location.href : "",
    };

    if (inquiryType === "puppy_interest") {
      payload.puppyName = initialPuppyName || "";
      payload.puppySlug = initialPuppySlug || "";
      payload.readyForDeposit = readyForDeposit;
    } else if (inquiryType === "puppy_finder") {
      payload.breed = breed;
      payload.genderPreference = genderPreference;
      payload.budgetMin = budgetMin ? Number(budgetMin) : null;
      payload.budgetMax = budgetMax ? Number(budgetMax) : null;
      payload.timeframe = timeframe;
      payload.deliveryNeeded = deliveryNeeded;
    } else if (inquiryType === "general") {
      payload.subject = subject;
      payload.notes = message;
    }

    try {
      const res = await fetch("https://pyplcountdown.netlify.app/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="inquire-card">
        <div className="inquire-success">
          <h2>Thank you!</h2>
          <p>We received your message and will be in touch soon.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="inquire-card" onSubmit={handleSubmit}>
      <h1 className="inquire-title">How can we help you today?</h1>
      <p className="inquire-subtitle">Let us know what you're looking for</p>

      <div className="inquire-field">
        <div className="inquire-radio-group">
          {TYPE_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`inquire-radio-option${inquiryType === opt.value ? " selected" : ""}`}
              onClick={() => setInquiryType(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="inquire-error">{error}</div>}

      {inquiryType === "puppy_interest" && initialPuppyName && (
        <div className="inquire-field">
          <label className="inquire-label">Puppy</label>
          <input className="inquire-input" type="text" value={initialPuppyName} readOnly />
        </div>
      )}

      <div className="inquire-field">
        <label className="inquire-label">First name</label>
        <input className="inquire-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>

      <div className="inquire-field">
        <label className="inquire-label">Last name</label>
        <input className="inquire-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <div className="inquire-field">
        <label className="inquire-label">Phone number</label>
        <input className="inquire-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="inquire-field">
        <label className="inquire-label">Email</label>
        <input className="inquire-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="inquire-field">
        <label className="inquire-label">City</label>
        <input className="inquire-input" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <div className="inquire-field">
        <label className="inquire-label">State</label>
        <input className="inquire-input" value={state} onChange={(e) => setState(e.target.value)} />
      </div>

      <div className="inquire-field">
        <label className="inquire-label">Preferred contact method</label>
        <select
          className="inquire-select"
          value={preferredContactMethod}
          onChange={(e) => setPreferredContactMethod(e.target.value)}
        >
          <option value="phone">Phone call</option>
          <option value="text">Text</option>
          <option value="email">Email</option>
        </select>
      </div>

      {inquiryType === "puppy_interest" && (
        <div className="inquire-field">
          <label className="inquire-label">Are you ready to place a deposit?</label>
          <select
            className="inquire-select"
            value={readyForDeposit}
            onChange={(e) => setReadyForDeposit(e.target.value)}
          >
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="not_yet">Not yet</option>
          </select>
        </div>
      )}

      {inquiryType === "puppy_finder" && (
        <>
          <div className="inquire-field">
            <label className="inquire-label">Preferred breed</label>
            <input className="inquire-input" value={breed} onChange={(e) => setBreed(e.target.value)} />
          </div>
          <div className="inquire-field">
            <label className="inquire-label">Gender preference</label>
            <select
              className="inquire-select"
              value={genderPreference}
              onChange={(e) => setGenderPreference(e.target.value)}
            >
              <option value="">No preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="inquire-field">
            <label className="inquire-label">Budget range</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                className="inquire-input"
                type="number"
                placeholder="Min"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <input
                className="inquire-input"
                type="number"
                placeholder="Max"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>
          <div className="inquire-field">
            <label className="inquire-label">Desired timeframe</label>
            <input className="inquire-input" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
          </div>
          <div className="inquire-field">
            <label className="inquire-checkbox-row">
              <input
                type="checkbox"
                checked={deliveryNeeded}
                onChange={(e) => setDeliveryNeeded(e.target.checked)}
              />
              I need delivery (not just local pickup)
            </label>
          </div>
        </>
      )}

      {inquiryType === "general" && (
        <>
          <div className="inquire-field">
            <label className="inquire-label">Subject</label>
            <input className="inquire-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="inquire-field">
            <label className="inquire-label">Message</label>
            <textarea
              className="inquire-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </>
      )}

      {inquiryType !== "general" && (
        <div className="inquire-field">
          <label className="inquire-label">Anything else we should know? (optional)</label>
          <textarea className="inquire-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      <div className="inquire-field">
        <label className="inquire-checkbox-row">
          <input
            type="checkbox"
            checked={consentToContact}
            onChange={(e) => setConsentToContact(e.target.checked)}
          />
          I consent to receive follow-up messages by phone, text, or email.
        </label>
      </div>

      {/* Honeypot field - hidden from real users via CSS, bots often fill it anyway */}
      <div className="inquire-honeypot">
        <label>Website</label>
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button type="submit" className="inquire-submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
