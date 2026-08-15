"use client";

import { useState } from "react";

interface Props {
  breedOptions: string[];
}

export default function ContactForm({ breedOptions }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || (!email.trim() && !phone.trim())) {
      setErrorMsg("Please enter your first name and at least an email or phone number.");
      setStatus("error");
      return;
    }
    if (!consent) {
      setErrorMsg("Please check the box consenting to be contacted before submitting.");
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
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: interest,
          notes: message.trim(),
          consentToContact: consent,
          website,
          sourceUrl: typeof window !== "undefined" ? window.location.href : "/contact",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form-section">
        <div className="contact-form-success">
          <p>🐾 Thanks! We&rsquo;ve received your message and will get back to you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="contact-form-section" onSubmit={handleSubmit}>
      <h2>Send Us a Message</h2>

      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input type="text" placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input type="text" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" placeholder="jane@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Phone (optional)</label>
        <input type="tel" placeholder="(555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <label>I am interested in...</label>
        <select value={interest} onChange={(e) => setInterest(e.target.value)}>
          <option value="">Select a breed</option>
          {breedOptions.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Message</label>
        <textarea
          placeholder="Tell us what you are looking for, ask us anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <label className="contact-form-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I agree to be contacted by phone, text, or email about my inquiry.
      </label>

      {status === "error" && <p className="contact-form-error">{errorMsg}</p>}

      <button className="pp-btn-primary" type="submit" disabled={status === "submitting"} style={{ marginTop: 4 }}>
        {status === "submitting" ? "Sending..." : "Send Message ›"}
      </button>
    </form>
  );
}
