"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addOption,
  updateOption,
  setOptionStatus,
  deleteOptionPermanently,
  uploadOptionPhoto,
  removeOptionPhoto,
  type OptionFormFields,
} from "../../../app/admin/puppy-finder/actions";
import type { OptionStatus, PuppyFinderOptionRow } from "../../../lib/puppyFinderTypes";
import { formatOptionPrice } from "../../../lib/puppyFinderTypes";

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

export default function OptionForm({
  proposalId,
  existing,
  isOpen,
  onOpen,
  onDone,
}: {
  proposalId: string;
  existing?: PuppyFinderOptionRow;
  /** Only meaningful when `existing` is set - whether this option's edit form is the one currently open. Ignored for a brand-new (no `existing`) instance, which is only ever mounted by the parent while it should be shown. */
  isOpen?: boolean;
  /** Existing-option only: tells the parent to make this the one open form. */
  onOpen?: () => void;
  onDone?: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(existing?.name || "");
  const [breed, setBreed] = useState(existing?.breed || "");
  const [gender, setGender] = useState(existing?.gender || "");
  const [ageText, setAgeText] = useState(existing?.age_text || "");
  const [color, setColor] = useState(existing?.color || "");
  const [sizeText, setSizeText] = useState(existing?.size_text || "");
  const [price, setPrice] = useState(
    existing?.price_cents !== null && existing?.price_cents !== undefined
      ? (existing.price_cents / 100).toString()
      : ""
  );
  const [description, setDescription] = useState(existing?.description || "");
  const [healthNotes, setHealthNotes] = useState(existing?.health_notes || "");
  const [displayOrder, setDisplayOrder] = useState(existing?.display_order?.toString() || "0");
  const [photoUrls, setPhotoUrls] = useState<string[]>(existing?.photo_urls || []);
  // Photos chosen before the option has a real id yet - held locally and
  // actually uploaded right after the option is created on Save, so the
  // admin never has to save once just to "unlock" the file picker.
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);

  const [optionId, setOptionId] = useState<string | null>(existing?.id || null);
  const [status, setStatus] = useState<OptionStatus>(existing?.status || "active");
  const [isSelected, setIsSelected] = useState(existing?.is_selected ?? false);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetFieldsFromExisting() {
    if (!existing) return;
    setName(existing.name || "");
    setBreed(existing.breed || "");
    setGender(existing.gender || "");
    setAgeText(existing.age_text || "");
    setColor(existing.color || "");
    setSizeText(existing.size_text || "");
    setPrice(
      existing.price_cents !== null && existing.price_cents !== undefined ? (existing.price_cents / 100).toString() : ""
    );
    setDescription(existing.description || "");
    setHealthNotes(existing.health_notes || "");
    setDisplayOrder(existing.display_order?.toString() || "0");
  }

  function clearPendingPhotos() {
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingPhotos([]);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const fields: OptionFormFields = {
      name,
      breed,
      gender,
      ageText,
      color,
      sizeText,
      priceCents: price.trim() ? Math.round(parseFloat(price) * 100) : null,
      description,
      healthNotes,
      displayOrder: parseInt(displayOrder, 10) || 0,
    };

    if (optionId) {
      const result = await updateOption(optionId, proposalId, fields);
      setSaving(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      return;
    }

    const result = await addOption(proposalId, fields);
    if (!result.success) {
      setSaving(false);
      setError(result.error);
      return;
    }
    const newOptionId = result.optionId;
    setOptionId(newOptionId);

    if (pendingPhotos.length > 0) {
      setUploadingPhoto(true);
      const uploadErrors: string[] = [];
      for (const pending of pendingPhotos) {
        const formData = new FormData();
        formData.append("file", pending.file);
        const uploadResult = await uploadOptionPhoto(newOptionId, proposalId, formData);
        if (uploadResult.success) {
          setPhotoUrls((prev) => [...prev, uploadResult.url]);
        } else {
          uploadErrors.push(uploadResult.error);
        }
        URL.revokeObjectURL(pending.previewUrl);
      }
      setUploadingPhoto(false);
      setPendingPhotos([]);
      if (uploadErrors.length > 0) {
        setError(`Puppy saved, but ${uploadErrors.length} photo(s) failed to upload: ${uploadErrors.join("; ")}`);
      }
    }

    setSaving(false);
  }

  /** Closes this form. Existing options revert any unsaved field edits; a freshly-created option gets one refresh so it becomes a normal persisted card once the admin is done. */
  function handleFinishEditing() {
    clearPendingPhotos();
    setError(null);
    if (existing) {
      resetFieldsFromExisting();
    } else if (optionId) {
      router.refresh();
    }
    onDone?.();
  }

  async function handleStatusChange(next: OptionStatus) {
    if (!optionId) return;
    setError(null);
    const result = await setOptionStatus(optionId, proposalId, next);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setStatus(next);
    if (next === "withdrawn" && isSelected) setIsSelected(false);
  }

  async function handleDelete() {
    if (!optionId) return;
    if (!confirm(`Permanently delete ${name || "this puppy option"}? This can't be undone.`)) return;
    const result = await deleteOptionPermanently(optionId, proposalId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  /** Once the option has a real id, a newly-chosen file uploads immediately (existing behavior). */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !optionId) return;

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB - please use one under 8MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadOptionPhoto(optionId, proposalId, formData);
    setUploadingPhoto(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setPhotoUrls((prev) => [...prev, result.url]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** Before the option has a real id yet, a chosen file is just queued locally with a preview - actually uploaded in handleSave once the option exists. */
  function handlePendingFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB - please use one under 8MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingPhotos((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemovePendingPhoto(previewUrl: string) {
    setPendingPhotos((prev) => {
      const match = prev.find((p) => p.previewUrl === previewUrl);
      if (match) URL.revokeObjectURL(match.previewUrl);
      return prev.filter((p) => p.previewUrl !== previewUrl);
    });
  }

  async function handlePhotoRemove(url: string) {
    if (!optionId) return;
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
    await removeOptionPhoto(optionId, proposalId, url);
  }

  // A brand-new instance (no `existing`) is only ever mounted by the
  // parent while it should be shown as a form, so it never renders the
  // summary view - not even right after its first save, since the admin
  // may still want to add photos before closing out.
  const showSummary = Boolean(existing) && !isOpen;

  if (showSummary) {
    const isWithdrawn = status === "withdrawn";
    return (
      <div className={`pf-option-summary${isWithdrawn ? " pf-option-summary--withdrawn" : ""}`}>
        <div className="pf-option-summary-photo">
          {photoUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrls[0]} alt={name || "Puppy"} />
          ) : (
            <div className="pf-option-summary-photo-placeholder">🐾</div>
          )}
        </div>
        <div className="pf-option-summary-body">
          <div className="pf-option-summary-title">
            {name || breed || "Untitled puppy option"}
            {isSelected && <span className="pf-tag pf-tag--selected">Selected</span>}
            {isWithdrawn && <span className="pf-tag pf-tag--withdrawn">No Longer Available</span>}
          </div>
          <div className="admin-hint">
            {[breed, price.trim() ? formatOptionPrice(Math.round(parseFloat(price) * 100)) : null]
              .filter(Boolean)
              .join(" · ") || "No details yet"}
          </div>
          {error && <div className="inquire-error">{error}</div>}
        </div>
        <div className="pf-option-summary-actions">
          <button type="button" className="admin-btn" onClick={() => onOpen?.()}>
            Edit
          </button>
          {isWithdrawn ? (
            <button type="button" className="admin-btn" onClick={() => handleStatusChange("active")}>
              Mark Active
            </button>
          ) : (
            <button type="button" className="admin-btn" onClick={() => handleStatusChange("withdrawn")}>
              Withdraw
            </button>
          )}
          <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-option-form">
      {error && <div className="inquire-error">{error}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Photos (first photo is the primary image)</label>
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
          {pendingPhotos.map((p) => (
            <div key={p.previewUrl} className="puppy-photo-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="" />
              <button type="button" className="puppy-photo-remove" onClick={() => handleRemovePendingPhoto(p.previewUrl)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={optionId ? handlePhotoUpload : handlePendingFileSelect}
          disabled={uploadingPhoto}
        />
        {uploadingPhoto && <p className="admin-hint">Uploading...</p>}
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Name (optional)</label>
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Breed (optional)</label>
          <input className="admin-input" value={breed} onChange={(e) => setBreed(e.target.value)} />
        </div>
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Gender (optional)</label>
          <select className="admin-select" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Not set</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Age (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. 10 weeks"
            value={ageText}
            onChange={(e) => setAgeText(e.target.value)}
          />
        </div>
      </div>

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Color (optional)</label>
          <input className="admin-input" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Size (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. Estimated 8-10 lbs full grown"
            value={sizeText}
            onChange={(e) => setSizeText(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">
          Price ($, optional) - this is the final, all-in Puppy Finder price the customer will see
        </label>
        <input
          className="admin-input"
          type="number"
          placeholder="e.g. 1500"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Description / Notes (optional)</label>
        <textarea className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Health / Vaccine Information (optional)</label>
        <textarea className="admin-textarea" value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Display order (lower shows first)</label>
        <input
          className="admin-input"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : optionId ? "Save changes" : "Add puppy option"}
        </button>
        {(existing || optionId) && (
          <button type="button" className="admin-btn" onClick={handleFinishEditing}>
            {existing ? "Cancel" : "Done"}
          </button>
        )}
      </div>
    </div>
  );
}
