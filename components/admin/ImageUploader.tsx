"use client";

import { useRef, useState } from "react";

interface ImageUploaderProps {
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export default function ImageUploader({ currentUrl, onUpload, onRemove }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await onRemove();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-field">
      <div className="admin-image-preview">
        <div className="admin-image-preview__thumb">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Featured" />
          ) : (
            "No image"
          )}
        </div>
        <div className="admin-image-preview__actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className="admin-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Working..." : currentUrl ? "Change image" : "Upload image"}
          </button>
          {currentUrl && (
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={handleRemove}
              disabled={busy}
            >
              Remove image
            </button>
          )}
        </div>
      </div>
      <p className="admin-hint">
        Recommended: 1200 x 900px (4:3), JPG or PNG, under 2MB. The image is
        cropped to fill its frame, so keep the subject centered.
      </p>
    </div>
  );
}
