"use client";

import { useState } from "react";
import PhoneInput from "../../../../../components/PhoneInput";

interface Props {
  puppyId: string;
  puppyName: string;
  slug: string;
}

export default function ReservationForm({ puppyId, puppyName, slug }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupOrDelivery, setPickupOrDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || (!phone.trim() && !email.trim())) {
      setError("Please add your name, and at least a phone number or email.");
      return;
    }
    if (!consent) {
      setError("Please check the box consenting to be contacted.");
      return;
    }

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");

    setStatus("submitting");
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "puppy_reservation",
          firstName,
          lastName,
          phone: phone.trim(),
          email: email.trim(),
          pickupOrDelivery,
          notes: notes.trim(),
          consentToContact: consent,
          website,
          puppyId,
          puppyName,
          puppySlug: slug,
          sourceUrl: typeof window !== "undefined" ? window.location.href : `/puppies/${slug}/reserve`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="reserve-success">
        <div className="reserve-success-icon">✓</div>
        <h2>Reservation Request Received!</h2>
        <p>
          Thanks — we&rsquo;ve got your request for <strong>{puppyName}</strong>. Our team will reach out shortly to
          arrange the next steps.
        </p>
        <a className="pp-btn-primary" href={`/puppies/${slug}`}>
          Back to {puppyName}&rsquo;s Page
        </a>
      </div>
    );
  }

  return (
    <form className="reserve-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {error && <p className="reserve-error">{error}</p>}

      <div className="reserve-field">
        <label>Full Name</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
      </div>
      <div className="reserve-field">
        <label>Phone Number</label>
        <PhoneInput value={phone} onChange={setPhone} placeholder="609-440-6809" />
      </div>
      <div className="reserve-field">
        <label>Email Address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@email.com" />
      </div>
      <div className="reserve-field">
        <label>Pickup or Delivery?</label>
        <div className="reserve-radio-group">
          {["Pickup", "Delivery", "Not sure yet"].map((opt) => (
            <div
              key={opt}
              className={`reserve-radio-pill${pickupOrDelivery === opt ? " pp-selected" : ""}`}
              onClick={() => setPickupOrDelivery(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
      <div className="reserve-field">
        <label>Notes / Message (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else we should know?" />
      </div>

      <label className="reserve-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I agree to be contacted about this reservation request.
      </label>

      <button type="submit" className="pp-btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit Reservation Request ›"}
      </button>
    </form>
  );
}
