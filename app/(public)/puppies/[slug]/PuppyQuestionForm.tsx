"use client";

import { useState } from "react";
import PhoneInput from "../../../../components/PhoneInput";

interface Props {
  puppyId: string;
  puppyName: string;
  breed: string;
  slug: string;
}

export default function PuppyQuestionForm({ puppyId, puppyName, breed, slug }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      setStatus("error");
      return;
    }
    if (!consent) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "puppy_interest",
          firstName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: message.trim(),
          consentToContact: consent,
          website,
          puppyId,
          puppyName,
          breed,
          puppySlug: slug,
          sourceUrl: typeof window !== "undefined" ? window.location.href : `/puppies/${slug}`,
          source: "Puppy Detail Page",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="question-success">
        <p>🐾 Thanks! We&rsquo;ve got your message and will get back to you soon.</p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button type="button" className="pp-btn-outline im-interested-btn" onClick={() => setExpanded(true)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        I&rsquo;m Interested
      </button>
    );
  }

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <h3 className="question-title">Interested in This Puppy?</h3>
      <p className="question-sub">Have a question or want to learn more about this puppy? Send us a message below.</p>

      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PhoneInput placeholder="Your phone" value={phone} onChange={setPhone} />
      <textarea
        placeholder="Your message or question..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <label className="question-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I agree to be contacted about this puppy.
      </label>

      {status === "error" && (
        <p className="question-error">Please add your name, email or phone, and check the box above.</p>
      )}

      <button type="submit" className="pp-btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send Message ›"}
      </button>
    </form>
  );
}
