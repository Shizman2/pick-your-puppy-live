"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPuppy,
  updatePuppy,
  deletePuppy,
  uploadPuppyPhoto,
  removePuppyPhoto,
  type PuppyFormFields,
} from "../../../app/admin/puppies/actions";
import { GENDER_OPTIONS, SIZE_OPTIONS, STATUS_OPTIONS, BADGE_OPTIONS, type PuppyRow } from "../../../lib/puppyTypes";

interface PuppyFormProps {
  existing?: PuppyRow;
}

export default function PuppyForm({ existing }: PuppyFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(existing?.name || "");
  const [breed, setBreed] = useState(existing?.breed || "");
  const [price, setPrice] = useState(existing ? (existing.price_cents / 100).toString() : "");
  const [gender, setGender] = useState<PuppyRow["gender"]>(existing?.gender || "male");
  const [dob, setDob] = useState(existing?.date_of_birth || "");
  const [size, setSize] = useState<PuppyRow["size"]>(existing?.size || "toy");
  const [status, setStatus] = useState<PuppyRow["status"]>(existing?.status || "available");
  const [badgeTag, setBadgeTag] = useState<PuppyRow["badge_tag"]>(existing?.badge_tag || null);
  const [description, setDescription] = useState(existing?.description || "");
  const [vetChecked, setVetChecked] = useState(existing?.vet_checked ?? true);
  const [vaccinated, setVaccinated] = useState(existing?.vaccinated ?? true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(existing?.delivery_available ?? true);
  const [isFeatured, setIsFeatured] = useState(existing?.is_featured ?? false);
  const [displayOrder, setDisplayOrder] = useState(existing?.display_order?.toString() || "0");
  const [photoUrls, setPhotoUrls] = useState<string[]>(existing?.photo_urls || []);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim() || !breed.trim()) {
      setError("Name and breed are required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Enter a valid price.");
      return;
    }

    setSaving(true);
    const fields: PuppyFormFields = {
      name,
      breed,
      priceCents: Math.round(priceNum * 100),
      gender,
      dateOfBirth: dob || null,
      size,
      status,
      badgeTag,
      description,
      vetChecked,
      vaccinated,
      deliveryAvailable,
      isFeatured,
      displayOrder: parseInt(displayOrder, 10) || 0,
    };

    const result = existing ? await updatePuppy(existing.id, fields) : await createPuppy(fields);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (!existing) {
      router.push(`/admin/puppies/${result.puppyId}`);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm(`Delete ${existing.name}? This can't be undone.`)) return;
    setSaving(true);
    const result = await deletePuppy(existing.id);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/admin/puppies");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !existing) return;

    const maxBytes = 8 * 1024 * 1024; // 8MB - leaves headroom under the 10MB server limit
    if (file.size > maxBytes) {
      setError(
        `That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB - please use one under 8MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadPuppyPhoto(existing.id, formData);
    setUploadingPhoto(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setPhotoUrls((prev) => [...prev, result.url]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhotoRemove(url: string) {
    if (!existing) return;
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
    await removePuppyPhoto(existing.id, url);
    router.refresh();
  }

  return (
    <div className="profile-card" style={{ maxWidth: 560 }}>
      {error && <div className="inquire-error">{error}</div>}

      {existing && (
        <div className="admin-field">
          <label className="admin-field__label">Photos</label>
          <div className="puppy-photo-grid">
            {photoUrls.map((url) => (
              <div key={url} className="puppy-photo-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={name} />
                <button type="button" className="puppy-photo-remove" onClick={() => handlePhotoRemove(url)}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          {uploadingPhoto && <p className="admin-hint">Uploading...</p>}
        </div>
      )}
      {!existing && (
        <p className="admin-hint" style={{ marginBottom: 14 }}>
          Save this puppy first, then you'll be able to upload photos.
        </p>
      )}

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Name</label>
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Breed</label>
          <input className="admin-input" value={breed} onChange={(e) => setBreed(e.target.value)} />
        </div>
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Price ($)</label>
          <input className="admin-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Gender</label>
          <select className="admin-select" value={gender} onChange={(e) => setGender(e.target.value as PuppyRow["gender"])}>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Date of birth</label>
          <input className="admin-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Size</label>
          <select className="admin-select" value={size || ""} onChange={(e) => setSize(e.target.value as PuppyRow["size"])}>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Status</label>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value as PuppyRow["status"])}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Badge tag</label>
          <select
            className="admin-select"
            value={badgeTag || ""}
            onChange={(e) => setBadgeTag((e.target.value || null) as PuppyRow["badge_tag"])}
          >
            <option value="">None</option>
            {BADGE_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Description</label>
        <textarea className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <label className="puppy-checkbox-row">
        <input type="checkbox" checked={vetChecked} onChange={(e) => setVetChecked(e.target.checked)} />
        Vet checked
      </label>
      <label className="puppy-checkbox-row">
        <input type="checkbox" checked={vaccinated} onChange={(e) => setVaccinated(e.target.checked)} />
        Vaccinated
      </label>
      <label className="puppy-checkbox-row">
        <input type="checkbox" checked={deliveryAvailable} onChange={(e) => setDeliveryAvailable(e.target.checked)} />
        Delivery available
      </label>
      <label className="puppy-checkbox-row">
        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
        Featured on homepage
      </label>

      <div className="admin-field">
        <label className="admin-field__label">Display order (lower shows first)</label>
        <input
          className="admin-input"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : existing ? "Save changes" : "Add puppy"}
        </button>
        {existing && (
          <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete} disabled={saving}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
