"use client";

import { useState } from "react";

export default function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");

  function submitForm() {
    if (!firstName.trim() || !email.trim() || !message.trim()) {
      alert("Please fill in your name, email, and message.");
      return;
    }
    // NOTE: preserved as-is from the current live site - this does not
    // actually submit anywhere yet. Fixing this was intentionally
    // deferred to a later task per an earlier decision.
    window.location.href = "/thank-you";
  }

  return (
    <div className="contact-form-section">
      <h2>Send Us a Message</h2>
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
          <option>Yorkie</option>
          <option>Maltipoo</option>
          <option>Not sure yet</option>
          <option>Just have a question</option>
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
      <button className="pp-btn-primary" onClick={submitForm} style={{ marginTop: 4 }}>
        Send Message ›
      </button>
    </div>
  );
}
