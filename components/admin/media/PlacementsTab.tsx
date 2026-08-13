"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPlacement,
  updatePlacement,
  deletePlacement,
  setPlacementStatus,
  generatePreviewToken,
  type PlacementFields,
} from "../../../app/admin/media/actions";
import {
  PAGE_TYPES,
  SLOTS_BY_PAGE_TYPE,
  IMAGE_SCALE_MIN,
  IMAGE_SCALE_MAX,
  IMAGE_OFFSET_MIN,
  IMAGE_OFFSET_MAX,
  BORDER_RADIUS_MAX,
  type MediaAssetRow,
  type MediaPlacementWithAsset,
  type PageType,
  type SlotId,
  type FitMode,
  type Alignment,
  type LinkTarget,
  type DisplayMode,
} from "../../../lib/mediaTypes";
import type { PuppyOption } from "./MediaManagerClient";

const PAGE_TYPE_URL: Record<PageType, string> = {
  homepage: "/",
  puppy_finder: "/puppy-finder",
  puppies: "/puppies",
  puppy_detail: "/puppies", // needs a slug appended - handled at preview time
};

const PREVIEW_WIDTHS = [
  { key: "mobile1", label: "390px", width: 390 },
  { key: "mobile2", label: "430px", width: 430 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "desktop", label: "Desktop", width: 1280 },
];

function emptyFields(defaultAssetId: string): PlacementFields {
  return {
    internalName: "",
    mediaAssetId: defaultAssetId,
    pageType: "homepage",
    pageIdentifier: null,
    slot: "homepage_hero",
    displayMode: "single",
    priority: 0,
    enabled: true,
    startAt: null,
    endAt: null,
    mobileVisible: true,
    desktopVisible: true,
    linkUrl: null,
    linkTarget: "_self",
    fitMode: "contain",
    alignment: "center",
    maxWidthPx: null,
    heightPx: null,
    borderRadiusPx: 0,
    backgroundColor: null,
    imageScalePercent: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    paddingTopPx: 0,
    paddingBottomPx: 0,
  };
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

function PlacementForm({
  assets,
  puppies,
  existing,
  onDone,
}: {
  assets: MediaAssetRow[];
  puppies: PuppyOption[];
  existing?: MediaPlacementWithAsset;
  onDone: () => void;
}) {
  const router = useRouter();
  const availableAssets = assets.filter((a) => !a.archived);

  const [fields, setFields] = useState<PlacementFields>(
    existing
      ? {
          internalName: existing.internal_name,
          mediaAssetId: existing.media_asset_id,
          pageType: existing.page_type,
          pageIdentifier: existing.page_identifier,
          slot: existing.slot,
          displayMode: existing.display_mode,
          priority: existing.priority,
          enabled: existing.enabled,
          startAt: existing.start_at,
          endAt: existing.end_at,
          mobileVisible: existing.mobile_visible,
          desktopVisible: existing.desktop_visible,
          linkUrl: existing.link_url,
          linkTarget: existing.link_target,
          fitMode: existing.fit_mode,
          alignment: existing.alignment,
          maxWidthPx: existing.max_width_px,
          heightPx: existing.height_px,
          borderRadiusPx: existing.border_radius_px,
          backgroundColor: existing.background_color,
          imageScalePercent: existing.image_scale_percent,
          imageOffsetX: existing.image_offset_x,
          imageOffsetY: existing.image_offset_y,
          paddingTopPx: existing.padding_top_px,
          paddingBottomPx: existing.padding_bottom_px,
        }
      : emptyFields(availableAssets[0]?.id || "")
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slotOptions = SLOTS_BY_PAGE_TYPE[fields.pageType];

  function set<K extends keyof PlacementFields>(key: K, value: PlacementFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handlePageTypeChange(pt: PageType) {
    const firstSlot = SLOTS_BY_PAGE_TYPE[pt][0].key;
    setFields((f) => ({ ...f, pageType: pt, slot: firstSlot, pageIdentifier: null }));
  }

  async function handleSave() {
    setError("");
    if (!fields.internalName.trim()) {
      setError("Placement name is required.");
      return;
    }
    if (!fields.mediaAssetId) {
      setError("Select a media asset - upload one in Asset Library first if none exist.");
      return;
    }

    setSubmitting(true);
    const result = existing ? await updatePlacement(existing.id, fields) : await createPlacement(fields);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <div className="media-panel">
      <h3>{existing ? "Edit Placement" : "New Placement"}</h3>
      {error && <div className="media-error">{error}</div>}

      <div className="media-form-grid">
        <div className="media-field">
          <label>Placement Name *</label>
          <input type="text" value={fields.internalName} onChange={(e) => set("internalName", e.target.value)} placeholder="e.g. Puppy Bundle Promotion" />
        </div>
        <div className="media-field">
          <label>Media Asset *</label>
          <select value={fields.mediaAssetId} onChange={(e) => set("mediaAssetId", e.target.value)}>
            <option value="">Select an asset...</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.internal_name}
              </option>
            ))}
          </select>
        </div>

        <div className="media-section-divider">Page Target</div>

        <div className="media-field">
          <label>Page Type</label>
          <select value={fields.pageType} onChange={(e) => handlePageTypeChange(e.target.value as PageType)}>
            {PAGE_TYPES.map((pt) => (
              <option key={pt.key} value={pt.key}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="media-field">
          <label>Slot</label>
          <select value={fields.slot} onChange={(e) => set("slot", e.target.value as SlotId)}>
            {slotOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {fields.pageType === "puppy_detail" && (
          <div className="media-field" style={{ gridColumn: "1 / -1" }}>
            <label>Specific Target</label>
            <select
              value={fields.pageIdentifier || ""}
              onChange={(e) => set("pageIdentifier", e.target.value || null)}
            >
              <option value="">All Puppy Detail Pages</option>
              {puppies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="media-section-divider">Behavior</div>

        <div className="media-field">
          <label>Display Mode</label>
          <select value={fields.displayMode} onChange={(e) => set("displayMode", e.target.value as DisplayMode)}>
            <option value="single">Single (highest priority only)</option>
            <option value="stacked">Stacked (show all eligible)</option>
          </select>
        </div>
        <div className="media-field">
          <label>Priority</label>
          <input type="number" value={fields.priority} onChange={(e) => set("priority", Number(e.target.value))} />
          <span className="media-hint">Higher number = shown first.</span>
        </div>

        <div className="media-field media-field-checkbox">
          <input type="checkbox" id="enabled" checked={fields.enabled} onChange={(e) => set("enabled", e.target.checked)} />
          <label htmlFor="enabled" style={{ textTransform: "none" }}>
            Enabled
          </label>
        </div>
        <div />

        <div className="media-field media-field-checkbox">
          <input type="checkbox" id="mobileVisible" checked={fields.mobileVisible} onChange={(e) => set("mobileVisible", e.target.checked)} />
          <label htmlFor="mobileVisible" style={{ textTransform: "none" }}>
            Visible on Mobile
          </label>
        </div>
        <div className="media-field media-field-checkbox">
          <input type="checkbox" id="desktopVisible" checked={fields.desktopVisible} onChange={(e) => set("desktopVisible", e.target.checked)} />
          <label htmlFor="desktopVisible" style={{ textTransform: "none" }}>
            Visible on Desktop
          </label>
        </div>

        <div className="media-section-divider">Scheduling</div>

        <div className="media-field">
          <label>Start Date/Time (optional)</label>
          <input
            type="datetime-local"
            value={toLocalInputValue(fields.startAt)}
            onChange={(e) => set("startAt", fromLocalInputValue(e.target.value))}
          />
        </div>
        <div className="media-field">
          <label>End Date/Time (optional)</label>
          <input
            type="datetime-local"
            value={toLocalInputValue(fields.endAt)}
            onChange={(e) => set("endAt", fromLocalInputValue(e.target.value))}
          />
        </div>

        <div className="media-section-divider">Link</div>

        <div className="media-field">
          <label>Link URL (optional)</label>
          <input type="url" value={fields.linkUrl || ""} onChange={(e) => set("linkUrl", e.target.value || null)} placeholder="https://..." />
        </div>
        <div className="media-field">
          <label>Link Target</label>
          <select value={fields.linkTarget} onChange={(e) => set("linkTarget", e.target.value as LinkTarget)}>
            <option value="_self">Same Tab</option>
            <option value="_blank">New Tab</option>
          </select>
        </div>

        <div className="media-section-divider">Size &amp; Style (controlled values only)</div>

        <div className="media-field">
          <label>Fit Mode</label>
          <select value={fields.fitMode} onChange={(e) => set("fitMode", e.target.value as FitMode)}>
            <option value="contain">Contain (safe for text banners)</option>
            <option value="cover">Cover</option>
            <option value="natural">Natural</option>
          </select>
        </div>
        <div className="media-field">
          <label>Alignment</label>
          <select value={fields.alignment} onChange={(e) => set("alignment", e.target.value as Alignment)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div className="media-field">
          <label>Max Width (px, optional)</label>
          <input type="number" min={50} max={2000} value={fields.maxWidthPx ?? ""} onChange={(e) => set("maxWidthPx", e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="media-field">
          <label>Height (px, optional)</label>
          <input type="number" min={20} max={1200} value={fields.heightPx ?? ""} onChange={(e) => set("heightPx", e.target.value ? Number(e.target.value) : null)} />
        </div>

        <div className="media-field">
          <label>Border Radius (0–{BORDER_RADIUS_MAX}px)</label>
          <input
            type="number"
            min={0}
            max={BORDER_RADIUS_MAX}
            value={fields.borderRadiusPx}
            onChange={(e) => set("borderRadiusPx", Math.min(BORDER_RADIUS_MAX, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <div className="media-field">
          <label>Background Color (optional)</label>
          <input type="text" value={fields.backgroundColor || ""} onChange={(e) => set("backgroundColor", e.target.value || null)} placeholder="#E8F1FF" />
        </div>

        <div className="media-field">
          <label>
            Image Scale ({IMAGE_SCALE_MIN}–{IMAGE_SCALE_MAX}%)
          </label>
          <input
            type="number"
            min={IMAGE_SCALE_MIN}
            max={IMAGE_SCALE_MAX}
            value={fields.imageScalePercent}
            onChange={(e) => set("imageScalePercent", Math.min(IMAGE_SCALE_MAX, Math.max(IMAGE_SCALE_MIN, Number(e.target.value))))}
          />
        </div>
        <div />

        <div className="media-field">
          <label>
            Horizontal Offset ({IMAGE_OFFSET_MIN} to {IMAGE_OFFSET_MAX}px)
          </label>
          <input
            type="number"
            min={IMAGE_OFFSET_MIN}
            max={IMAGE_OFFSET_MAX}
            value={fields.imageOffsetX}
            onChange={(e) => set("imageOffsetX", Math.min(IMAGE_OFFSET_MAX, Math.max(IMAGE_OFFSET_MIN, Number(e.target.value))))}
          />
        </div>
        <div className="media-field">
          <label>
            Vertical Offset ({IMAGE_OFFSET_MIN} to {IMAGE_OFFSET_MAX}px)
          </label>
          <input
            type="number"
            min={IMAGE_OFFSET_MIN}
            max={IMAGE_OFFSET_MAX}
            value={fields.imageOffsetY}
            onChange={(e) => set("imageOffsetY", Math.min(IMAGE_OFFSET_MAX, Math.max(IMAGE_OFFSET_MIN, Number(e.target.value))))}
          />
        </div>

        <div className="media-field">
          <label>Padding Top (0–200px)</label>
          <input type="number" min={0} max={200} value={fields.paddingTopPx} onChange={(e) => set("paddingTopPx", Math.min(200, Math.max(0, Number(e.target.value))))} />
        </div>
        <div className="media-field">
          <label>Padding Bottom (0–200px)</label>
          <input type="number" min={0} max={200} value={fields.paddingBottomPx} onChange={(e) => set("paddingBottomPx", Math.min(200, Math.max(0, Number(e.target.value))))} />
        </div>
      </div>

      <div className="media-form-actions">
        <button className="media-btn" onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving..." : existing ? "Save Changes" : "Save Draft"}
        </button>
        <button className="media-btn secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function PreviewPanel({ placement, puppies, onClose }: { placement: MediaPlacementWithAsset; puppies: PuppyOption[]; onClose: () => void }) {
  const [width, setWidth] = useState(390);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await generatePreviewToken(placement.id);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      let path = PAGE_TYPE_URL[placement.page_type];
      if (placement.page_type === "puppy_detail") {
        const puppy = placement.page_identifier
          ? puppies.find((p) => p.id === placement.page_identifier)
          : puppies[0];
        if (!puppy) {
          setError("No puppy available to preview against.");
          setLoading(false);
          return;
        }
        path = `/puppies/${puppy.slug}`;
      }

      setPreviewUrl(`${path}?previewToken=${result.data!.token}`);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement.id]);

  return (
    <div className="media-panel">
      <h3>Preview: {placement.internal_name}</h3>
      {error && <div className="media-error">{error}</div>}

      <div className="media-preview-widths">
        {PREVIEW_WIDTHS.map((w) => (
          <button
            key={w.key}
            className={`media-btn small${width === w.width ? "" : " secondary"}`}
            onClick={() => setWidth(w.width)}
          >
            {w.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Generating preview link...</p>
      ) : previewUrl ? (
        <div className="media-preview-frame-wrap">
          <iframe src={previewUrl} className="media-preview-frame" style={{ width, height: 800 }} />
        </div>
      ) : null}

      <div className="media-form-actions">
        <button className="media-btn secondary" onClick={onClose}>
          Close Preview
        </button>
      </div>
      <p className="media-hint">This preview link expires in 30 minutes and only shows this one draft placement - nothing here is public yet.</p>
    </div>
  );
}

export default function PlacementsTab({
  placements,
  assets,
  puppies,
}: {
  placements: MediaPlacementWithAsset[];
  assets: MediaAssetRow[];
  puppies: PuppyOption[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  async function handleStatusChange(p: MediaPlacementWithAsset, status: "published" | "paused" | "draft") {
    await setPlacementStatus(p.id, status, p.page_type, p.page_identifier);
    router.refresh();
  }

  async function handleDelete(p: MediaPlacementWithAsset) {
    if (!confirm(`Delete placement "${p.internal_name}"? This can't be undone.`)) return;
    await deletePlacement(p.id, p.page_type, p.page_identifier);
    router.refresh();
  }

  return (
    <div>
      <div className="media-toolbar">
        {!showNew && (
          <button className="media-btn" onClick={() => setShowNew(true)} disabled={assets.filter((a) => !a.archived).length === 0}>
            + New Placement
          </button>
        )}
      </div>

      {assets.filter((a) => !a.archived).length === 0 && (
        <p className="media-hint" style={{ marginBottom: 12 }}>
          Upload a media asset in the Asset Library tab first.
        </p>
      )}

      {showNew && <PlacementForm assets={assets} puppies={puppies} onDone={() => setShowNew(false)} />}

      {placements.length === 0 ? (
        <div className="contacts-empty">No placements yet.</div>
      ) : (
        <table className="media-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Page / Slot</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Schedule</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td>{p.internal_name}</td>
                  <td>
                    {p.page_type} / {p.slot}
                    {p.page_identifier && <div className="media-hint">{puppies.find((pp) => pp.id === p.page_identifier)?.name || p.page_identifier}</div>}
                  </td>
                  <td>
                    <span className={`media-status-pill media-status-${p.status}`}>{p.status}</span>
                    {!p.enabled && <div className="media-hint">disabled</div>}
                  </td>
                  <td>{p.priority}</td>
                  <td className="media-hint">
                    {p.start_at ? new Date(p.start_at).toLocaleDateString() : "—"} to{" "}
                    {p.end_at ? new Date(p.end_at).toLocaleDateString() : "no end"}
                  </td>
                  <td>
                    <div className="media-asset-actions">
                      <button className="media-btn small secondary" onClick={() => setEditingId(editingId === p.id ? null : p.id)}>
                        Edit
                      </button>
                      <button className="media-btn small secondary" onClick={() => setPreviewingId(previewingId === p.id ? null : p.id)}>
                        Preview
                      </button>
                      {p.status !== "published" ? (
                        <button className="media-btn small" onClick={() => handleStatusChange(p, "published")}>
                          Publish
                        </button>
                      ) : (
                        <button className="media-btn small secondary" onClick={() => handleStatusChange(p, "paused")}>
                          Pause
                        </button>
                      )}
                      <button className="media-btn small secondary" onClick={() => handleDelete(p)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === p.id && (
                  <tr>
                    <td colSpan={6}>
                      <PlacementForm assets={assets} puppies={puppies} existing={p} onDone={() => setEditingId(null)} />
                    </td>
                  </tr>
                )}
                {previewingId === p.id && (
                  <tr>
                    <td colSpan={6}>
                      <PreviewPanel placement={p} puppies={puppies} onClose={() => setPreviewingId(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
