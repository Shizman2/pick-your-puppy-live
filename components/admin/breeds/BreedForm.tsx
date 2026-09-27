"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBreed,
  updateBreed,
  deleteBreed,
  uploadBreedProfileImage,
  removeBreedProfileImage,
  type BreedFormFields,
} from "../../../app/admin/breeds/actions";
import type { BreedRow } from "../../../lib/breedTypes";

export default function BreedForm({ existing }: { existing?: BreedRow }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(existing?.name || "");
  const [expectedAdultSize, setExpectedAdultSize] = useState(existing?.expected_adult_size || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [shortName, setShortName] = useState(existing?.short_name || "");
  const [personality, setPersonality] = useState(existing?.personality || "");
  const [energyLevel, setEnergyLevel] = useState(existing?.energy_level || "");
  const [groomingLevel, setGroomingLevel] = useState(existing?.grooming_level || "");
  const [livingSpaceFit, setLivingSpaceFit] = useState(existing?.living_space_fit || "");
  const [companionStyle, setCompanionStyle] = useState(existing?.companion_style || "");
  const [goodToKnow, setGoodToKnow] = useState(existing?.good_to_know || "");
  const [showProfile, setShowProfile] = useState(existing?.show_profile ?? false);
  const [profileImageUrl, setProfileImageUrl] = useState(existing?.profile_image_url || null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breedShortLabel = shortName.trim() || name.trim() || "this breed";

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Breed name is required.");
      return;
    }

    setSaving(true);
    const fields: BreedFormFields = {
      name,
      expectedAdultSize,
      description,
      shortName,
      personality,
      energyLevel,
      groomingLevel,
      livingSpaceFit,
      companionStyle,
      goodToKnow,
      showProfile,
    };
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !existing) return;

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB - please use one under 8MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadBreedProfileImage(existing.id, formData);
    setUploadingImage(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setProfileImageUrl(result.url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImageRemove() {
    if (!existing) return;
    setProfileImageUrl(null);
    await removeBreedProfileImage(existing.id);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="profile-card">
        {error && <div className="inquire-error">{error}</div>}

        <div className="admin-field">
          <label className="admin-field__label">Breed Name</label>
          <input className="admin-input" placeholder="e.g. Yorkshire Terrier" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Short Name</label>
          <input
            className="admin-input"
            placeholder="e.g. Yorkie"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
          <p className="admin-hint">
            Used in customer-facing headings, e.g. &ldquo;Is a {breedShortLabel} Right for You?&rdquo; Also matches a
            puppy&rsquo;s breed field, same as Breed Name above (either one resolves to this profile).
          </p>
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Typical Adult Weight (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. 4-7 lbs"
            value={expectedAdultSize}
            onChange={(e) => setExpectedAdultSize(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Personality (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. Affectionate, confident & playful"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Energy Level (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. Moderate"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Grooming Level (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. Regular grooming needed"
            value={groomingLevel}
            onChange={(e) => setGroomingLevel(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Living-Space Fit (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. Apartment & small-home friendly"
            value={livingSpaceFit}
            onChange={(e) => setLivingSpaceFit(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Companion Style (optional)</label>
          <input
            className="admin-input"
            placeholder="e.g. Loves being close to their people"
            value={companionStyle}
            onChange={(e) => setCompanionStyle(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">What {breedShortLabel} Life Is Like (optional)</label>
          <textarea
            className="admin-textarea"
            placeholder="Write about what everyday life with this breed is like..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ minHeight: 120 }}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Good to Know (optional)</label>
          <textarea
            className="admin-textarea"
            placeholder="Practical considerations customers should know..."
            value={goodToKnow}
            onChange={(e) => setGoodToKnow(e.target.value)}
            style={{ minHeight: 100 }}
          />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Breed Profile Image</label>
          {profileImageUrl && (
            <div className="breed-image-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profileImageUrl} alt={name} className="breed-image-preview" />
              {existing && (
                <button type="button" className="breed-image-remove" onClick={handleImageRemove}>
                  Remove image
                </button>
              )}
            </div>
          )}
          {existing ? (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              {uploadingImage && <p className="admin-hint">Uploading...</p>}
            </>
          ) : (
            <p className="admin-hint">Save this breed first, then you&rsquo;ll be able to upload its profile image.</p>
          )}
        </div>

        <div className="admin-field">
          <div className="admin-toggle-row">
            <span className="admin-toggle-label">Show Breed Profile on Puppy Pages</span>
            <button
              type="button"
              className={`admin-toggle${showProfile ? " on" : ""}`}
              role="switch"
              aria-checked={showProfile}
              onClick={() => setShowProfile((v) => !v)}
            />
          </div>
          <p className="admin-hint">
            Off by default. When off, the &ldquo;Is a {breedShortLabel} Right for You?&rdquo; section is completely
            hidden on every matching puppy&rsquo;s page, even if the fields above are filled in.
          </p>
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
