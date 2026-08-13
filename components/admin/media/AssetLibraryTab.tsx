"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAsset, replaceMediaAsset, archiveMediaAsset, getAssetUsageCount } from "../../../app/admin/media/actions";
import type { MediaAssetRow, MediaType } from "../../../lib/mediaTypes";

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [internalName, setInternalName] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image_banner");
  const [altText, setAltText] = useState("");
  const [isDecorative, setIsDecorative] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);
  const desktopFileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a default image file.");
      return;
    }
    if (!internalName.trim()) {
      setError("Internal name is required.");
      return;
    }
    if (!isDecorative && !altText.trim()) {
      setError("Alt text is required unless this image is marked decorative.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    if (mobileFileRef.current?.files?.[0]) formData.set("mobileFile", mobileFileRef.current.files[0]);
    if (desktopFileRef.current?.files?.[0]) formData.set("desktopFile", desktopFileRef.current.files[0]);
    formData.set("internalName", internalName.trim());
    formData.set("mediaType", mediaType);
    formData.set("altText", altText.trim());
    formData.set("isDecorative", String(isDecorative));

    setSubmitting(true);
    const result = await uploadMediaAsset(formData);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    onDone();
  }

  return (
    <form className="media-panel" onSubmit={handleSubmit}>
      <h3>Upload New Asset</h3>
      {error && <div className="media-error">{error}</div>}

      <div className="media-form-grid">
        <div className="media-field">
          <label>Default Image *</label>
          <input type="file" accept="image/*" ref={fileRef} />
          <span className="media-hint">Used as the fallback on all devices.</span>
        </div>
        <div className="media-field">
          <label>Internal Name *</label>
          <input type="text" value={internalName} onChange={(e) => setInternalName(e.target.value)} placeholder="e.g. Spring Sale Banner" />
        </div>

        <div className="media-field">
          <label>Mobile Image (optional)</label>
          <input type="file" accept="image/*" ref={mobileFileRef} />
        </div>
        <div className="media-field">
          <label>Desktop Image (optional)</label>
          <input type="file" accept="image/*" ref={desktopFileRef} />
        </div>

        <div className="media-field">
          <label>Media Type</label>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)}>
            <option value="image_banner">Image Banner (complete graphic)</option>
            <option value="image_only">Image Only (decorative/product image)</option>
            <option value="promo_banner">Promo Banner (reserved for future use)</option>
          </select>
        </div>
        <div className="media-field media-field-checkbox">
          <input type="checkbox" id="decorative" checked={isDecorative} onChange={(e) => setIsDecorative(e.target.checked)} />
          <label htmlFor="decorative" style={{ textTransform: "none" }}>
            This image is decorative (no alt text needed)
          </label>
        </div>

        {!isDecorative && (
          <div className="media-field" style={{ gridColumn: "1 / -1" }}>
            <label>Alt Text *</label>
            <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image for screen readers" />
          </div>
        )}
      </div>

      <div className="media-form-actions">
        <button type="submit" className="media-btn" disabled={submitting}>
          {submitting ? "Uploading..." : "Upload Asset"}
        </button>
        <button type="button" className="media-btn secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AssetCard({ asset, usageCount }: { asset: MediaAssetRow; usageCount: number }) {
  const router = useRouter();
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState("");
  const replaceFileRef = useRef<HTMLInputElement>(null);

  async function handleReplace() {
    const file = replaceFileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    const result = await replaceMediaAsset(asset.id, formData);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setReplacing(false);
    router.refresh();
  }

  async function handleArchive() {
    const liveCount = await getAssetUsageCount(asset.id);
    const msg =
      liveCount > 0
        ? `This asset is currently used by ${liveCount} active placement${liveCount === 1 ? "" : "s"}. Archiving won't delete those placements, but you won't be able to select this asset for new ones. Continue?`
        : "Archive this asset?";
    if (!confirm(msg)) return;
    await archiveMediaAsset(asset.id);
    router.refresh();
  }

  return (
    <div className="media-asset-card">
      <div className="media-asset-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.file_url} alt={asset.alt_text || ""} />
      </div>
      <div className="media-asset-body">
        {asset.archived && <span className="media-usage-badge media-archived-badge">Archived</span>}
        {usageCount > 0 && <span className="media-usage-badge">Used in {usageCount}</span>}
        <div className="media-asset-name">{asset.internal_name}</div>
        <div className="media-asset-meta">
          {asset.media_type} · {formatBytes(asset.file_size)}
        </div>

        {replacing ? (
          <div>
            <input type="file" accept="image/*" ref={replaceFileRef} style={{ marginBottom: 6, width: "100%" }} />
            {error && <div className="media-error">{error}</div>}
            <div className="media-asset-actions">
              <button className="media-btn small" onClick={handleReplace}>
                Confirm Replace
              </button>
              <button className="media-btn small secondary" onClick={() => setReplacing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="media-asset-actions">
            <button className="media-btn small secondary" onClick={() => setReplacing(true)}>
              Replace
            </button>
            {!asset.archived && (
              <button className="media-btn small secondary" onClick={handleArchive}>
                Archive
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssetLibraryTab({
  assets,
  usageCounts,
}: {
  assets: MediaAssetRow[];
  usageCounts: Record<string, number>;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div>
      <div className="media-toolbar">
        {!showUpload && (
          <button className="media-btn" onClick={() => setShowUpload(true)}>
            + Upload New Asset
          </button>
        )}
      </div>

      {showUpload && <UploadForm onDone={() => setShowUpload(false)} />}

      {assets.length === 0 ? (
        <div className="contacts-empty">No media assets uploaded yet.</div>
      ) : (
        <div className="media-asset-grid">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} usageCount={usageCounts[asset.id] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}
