"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addContact } from "../../../app/admin/contacts/actions";
import type { ContactStatus } from "../../../lib/contactTypes";

const STATUS_OPTIONS: ContactStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "reserved",
  "customer",
  "closed",
];

export default function AddContactForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<ContactStatus>("new");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError("Enter at least a phone number or email.");
      return;
    }

    setSaving(true);
    const result = await addContact({ firstName, lastName, phone, email, city, state, status });
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.matchedExisting) {
      setNotice("A contact with this phone or email already exists - opening their profile instead.");
      setTimeout(() => router.push(`/admin/contacts/${result.contactId}`), 1200);
    } else {
      router.push(`/admin/contacts/${result.contactId}`);
    }
  }

  return (
    <form className="profile-card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      {error && <div className="inquire-error">{error}</div>}
      {notice && <div className="admin-hint" style={{ marginBottom: 12 }}>{notice}</div>}

      <div className="admin-field">
        <label className="admin-field__label">First name</label>
        <input className="admin-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Last name</label>
        <input className="admin-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Phone</label>
        <input className="admin-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Email</label>
        <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">City</label>
        <input className="admin-input" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">State</label>
        <input className="admin-input" value={state} onChange={(e) => setState(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Status</label>
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
        {saving ? "Saving..." : "Add contact"}
      </button>
    </form>
  );
}
