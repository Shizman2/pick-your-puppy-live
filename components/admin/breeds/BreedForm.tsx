"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBreed, updateBreed, deleteBreed, type BreedFormFields } from "../../../app/admin/breeds/actions";
import type { BreedRow } from "../../../lib/breedTypes";

export default function BreedForm({ existing }: { existing?: BreedRow }) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name || "");
  const [expectedAdultSize, setExpectedAdultSize] = useState(existing?.expected_adult_size || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Breed name is required.");
      return;
    }

    setSaving(true);
    const fields: BreedFormFields = { name, expectedAdultSize, description };
    const result = existing ? await updateBreed(existing.id, fields) : await createBreed(fields);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (!existing) {
      router.push(`/admin/breeds/${result.breedId}`);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm(`Delete ${existing.name}? This can't be undone.`)) return;
    setSaving(true);
    const result = await deleteBreed(existing.id);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/admin/breeds");
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="profile-card">
        {error && <div className="inquire-error">{error}</div>}

        <div className="admin-field">
          <label className="admin-field__label">Breed Name</label>
          <input className="admin-input" placeholder="e.g. Yorkie" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Expected Adult Size (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. 4-7 lbs, or Typically 5-10 lbs"
            value={expectedAdultSize}
            onChange={(e) => setExpectedAdultSize(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Breed Description (optional)</label>
          <textarea
            className="admin-textarea"
            placeholder="Write your own description of this breed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ minHeight: 140 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : existing ? "Save changes" : "Add breed"}
          </button>
          {existing && (
            <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete} disabled={saving}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
