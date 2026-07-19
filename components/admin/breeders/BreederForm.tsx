"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBreeder, updateBreeder, deleteBreeder, type BreederFormFields } from "../../../app/admin/breeders/actions";
import type { BreederRow } from "../../../lib/breederTypes";
import type { PuppyRow } from "../../../lib/puppyTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

interface BreederFormProps {
  existing?: BreederRow;
  linkedPuppies?: PuppyRow[];
}

export default function BreederForm({ existing, linkedPuppies = [] }: BreederFormProps) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name || "");
  const [phone, setPhone] = useState(existing?.phone || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [location, setLocation] = useState(existing?.location || "");
  const [breedsText, setBreedsText] = useState((existing?.breeds || []).join(", "));
  const [notes, setNotes] = useState(existing?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    const fields: BreederFormFields = {
      name,
      phone,
      email,
      location,
      breeds: breedsText.split(",").map((b) => b.trim()).filter(Boolean),
      notes,
    };

    const result = existing ? await updateBreeder(existing.id, fields) : await createBreeder(fields);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (!existing) {
      router.push(`/admin/breeders/${result.breederId}`);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm(`Delete ${existing.name}? This can't be undone.`)) return;
    setSaving(true);
    const result = await deleteBreeder(existing.id);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/admin/breeders");
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="profile-card">
        {error && <div className="inquire-error">{error}</div>}

        <div className="admin-field">
          <label className="admin-field__label">Name</label>
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Phone</label>
          <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Email</label>
          <input className="admin-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Location</label>
          <input className="admin-input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Breeds (comma-separated)</label>
          <input
            className="admin-input"
            placeholder="Yorkie, Maltipoo, Cavapoo"
            value={breedsText}
            onChange={(e) => setBreedsText(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Notes</label>
          <textarea className="admin-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : existing ? "Save changes" : "Add breeder"}
          </button>
          {existing && (
            <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete} disabled={saving}>
              Delete
            </button>
          )}
        </div>
      </div>

      {existing && (
        <div className="profile-card" style={{ marginTop: 16 }}>
          <h2 className="admin-card__title">Puppies from this breeder</h2>
          {linkedPuppies.length === 0 ? (
            <p className="admin-hint">No puppies linked yet. Set this breeder on a puppy's edit page.</p>
          ) : (
            linkedPuppies.map((p) => (
              <div key={p.id} className="breeder-puppy-list-item">
                <Link href={`/admin/puppies/${p.id}`}>{p.name}</Link>
                <span>{formatPriceFromCents(p.price_cents)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
