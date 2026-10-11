"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadParentPhoto, removeParentPhoto, type ParentPhotoSlot } from "../../../app/admin/puppies/actions";

const MAX_BYTES = 8 * 1024 * 1024;

const SLOT_LABEL: Record<ParentPhotoSlot, string> = { mother: "♀ Mom", father: "♂ Dad" };

// One fixed photo per parent - no gallery, no sorting. Never touches photo_urls.
function ParentSlot({ puppyId, slot, initialUrl }: { puppyId: string; slot: ParentPhotoSlot; initialUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file || busy) return;
    if (file.size > MAX_BYTES) {
      setError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB - please use one under 8MB.`);
      return;
    }
    setError(null);
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadParentPhoto(puppyId, slot, formData);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setUrl(result.url);
    router.refresh();
  }

  async function handleRemove() {
    if (busy || !url) return;
    if (!confirm(`Remove the ${slot === "mother" ? "Mom" : "Dad"} photo?`)) return;
    setError(null);
    setBusy(true);
    const result = await removeParentPhoto(puppyId, slot);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setUrl(null);
    router.refresh();
  }

  return (
    <div className={`parent-photo-slot parent-photo-slot--${slot}`}>
      <div className="parent-photo-slot__label">{SLOT_LABEL[slot]}</div>
      <div className="parent-photo-slot__preview">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={slot === "mother" ? "Mom" : "Dad"} />
        ) : (
          <span>No photo</span>
        )}
      </div>
      <div className="parent-photo-slot__actions">
        <label className={`admin-btn${busy ? " is-disabled" : ""}`}>
          {busy ? "Saving..." : url ? "Replace" : "Upload"}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} disabled={busy} hidden />
        </label>
        {url && (
          <button type="button" className="admin-btn" onClick={handleRemove} disabled={busy}>
            Remove
          </button>
        )}
      </div>
      {error && (
        <div className="inquire-error" role="alert" style={{ marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function ParentPhotosField({
  puppyId,
  motherUrl,
  fatherUrl,
}: {
  puppyId: string;
  motherUrl: string | null;
  fatherUrl: string | null;
}) {
  return (
    <div className="admin-field">
      <label className="admin-field__label">Parent Photos (optional)</label>
      <div className="parent-photo-grid">
        <ParentSlot puppyId={puppyId} slot="mother" initialUrl={motherUrl} />
        <ParentSlot puppyId={puppyId} slot="father" initialUrl={fatherUrl} />
      </div>
    </div>
  );
}
