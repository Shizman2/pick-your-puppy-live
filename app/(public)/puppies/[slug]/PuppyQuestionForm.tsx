"use client";

import { useState } from "react";

interface Props {
  puppyId: string;
  puppyName: string;
  breed: string;
  slug: string;
}

export default function PuppyQuestionForm({ puppyId, puppyName, breed, slug }: Props) {
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
      <input type="tel" placeholder="Your phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
