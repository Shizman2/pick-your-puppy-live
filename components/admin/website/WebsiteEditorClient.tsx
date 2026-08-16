"use client";

import { useRef, useState } from "react";
import {
  createContentBlock,
  updateContentBlockText,
  deleteContentBlock,
  uploadContentImage,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  moveFaqCategory,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
  moveFaqItem,
  toggleFaqItemVisibility,
} from "../../../app/admin/website/actions";
import {
  WEBSITE_PAGES,
  FAQ_ICON_OPTIONS,
  type ContentBlockRow,
  type ContentPage,
  type ContentType,
  type FaqCategoryWithItems,
} from "../../../lib/contentTypes";
import type { RecentChange, MediaItem } from "../../../lib/content";
import { formatRelativeTime } from "../../../lib/formatRelative";

interface WebsiteEditorClientProps {
  blocksByPage: Record<ContentPage, ContentBlockRow[]>;
  faqCategories: FaqCategoryWithItems[];
  recentChanges: RecentChange[];
  mediaItems: MediaItem[];
}

type Tab = "content" | "navigation" | "seo" | "media" | "settings";

function PageIcon({ icon }: { icon: string }) {
  const paths: Record<string, string> = {
    home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
    info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v.01M12 12v5",
    paw: "M12 21c4-3 7-6 7-10a5 5 0 00-9.5-2A5 5 0 005 11c0 4 3 7 7 10z",
    phone:
      "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
    help: "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
    link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  };
  return (
    <div className="website-page-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d={paths[icon] || paths.info} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function TextBlockEditor({ block }: { block: ContentBlockRow }) {
  const [value, setValue] = useState(block.text_value || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateContentBlockText(block.id, value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${block.label}"?`)) return;
    await deleteContentBlock(block.id);
  }

  return (
    <div className="content-block-card">
      <div className="content-block-label">
        <span>
          {block.label} <span className="content-block-key">({block.section_key})</span>
        </span>
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={handleDelete}
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          Remove
        </button>
      </div>
      <textarea className="admin-textarea" value={value} onChange={(e) => setValue(e.target.value)} />
      <button
        type="button"
        className="admin-btn admin-btn--primary"
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: 8 }}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}

function ImageBlockEditor({ block }: { block: ContentBlockRow }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(block.image_url);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await uploadContentImage(block.id, formData);
    setUploading(false);
    setImageUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete() {
    if (!confirm(`Remove "${block.label}"?`)) return;
    await deleteContentBlock(block.id);
  }

  return (
    <div className="content-block-card">
      <div className="content-block-label">
        <span>
          {block.label} <span className="content-block-key">({block.section_key})</span>
        </span>
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={handleDelete}
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          Remove
        </button>
      </div>
      <div className="content-block-image-preview">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={block.label} />
        ) : (
          "No image"
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      {uploading && <p className="admin-hint">Uploading...</p>}
    </div>
  );
}

function AddBlockForm({ page, nextOrder }: { page: ContentPage; nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [sectionKey, setSectionKey] = useState("");
  const [label, setLabel] = useState("");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [textValue, setTextValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setSaving(true);
    const result = await createContentBlock({ page, sectionKey, label, contentType, textValue, displayOrder: nextOrder });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setSectionKey("");
    setLabel("");
    setTextValue("");
  }

  if (!open) {
    return (
      <button type="button" className="admin-btn" onClick={() => setOpen(true)}>
        + Add field
      </button>
    );
  }

  return (
    <div className="add-block-form">
      {error && <div className="inquire-error">{error}</div>}
      <div className="admin-field">
        <label className="admin-field__label">Label (shown to you here)</label>
        <input className="admin-input" placeholder="e.g. Hero Headline" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Section key (used in code, no spaces)</label>
        <input
          className="admin-input"
          placeholder="e.g. hero_headline"
          value={sectionKey}
          onChange={(e) => setSectionKey(e.target.value)}
        />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Type</label>
        <select className="admin-select" value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)}>
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>
      </div>
      {contentType === "text" && (
        <div className="admin-field">
          <label className="admin-field__label">Initial text</label>
          <textarea className="admin-textarea" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "Add"}
        </button>
        <button type="button" className="admin-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function FaqItemEditor({
  item,
  categories,
}: {
  item: FaqCategoryWithItems["items"][number];
  categories: FaqCategoryWithItems[];
}) {
  const [question, setQuestion] = useState(item.question);
  const [answer, setAnswer] = useState(item.answer);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateFaqItem(item.id, question, answer, categoryId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleDelete() {
    if (!confirm("Delete this FAQ item?")) return;
    await deleteFaqItem(item.id);
  }

  async function handleMove(direction: "up" | "down") {
    await moveFaqItem(item.id, item.category_id, direction);
  }

  async function handleToggleVisible() {
    await toggleFaqItemVisibility(item.id, !item.is_visible);
  }

  return (
    <div className="faq-item-card">
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button type="button" className="admin-btn" onClick={() => handleMove("up")} title="Move up">
          ↑
        </button>
        <button type="button" className="admin-btn" onClick={() => handleMove("down")} title="Move down">
          ↓
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={handleToggleVisible}
          title={item.is_visible ? "Visible on the public FAQ page" : "Hidden from the public FAQ page"}
        >
          {item.is_visible ? "Visible" : "Hidden"}
        </button>
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Question</label>
        <input className="admin-input" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Answer</label>
        <textarea className="admin-textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Section</label>
        <select className="admin-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
        <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function AddFaqForm({ categoryId, nextOrder }: { categoryId: string; nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setSaving(true);
    const result = await createFaqItem(categoryId, question, answer, nextOrder);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setQuestion("");
    setAnswer("");
  }

  if (!open) {
    return (
      <button type="button" className="admin-btn admin-btn--primary" onClick={() => setOpen(true)}>
        + Add Question
      </button>
    );
  }

  return (
    <div className="add-block-form">
      {error && <div className="inquire-error">{error}</div>}
      <div className="admin-field">
        <label className="admin-field__label">Question</label>
        <input className="admin-input" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Answer</label>
        <textarea className="admin-textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "Add"}
        </button>
        <button type="button" className="admin-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function FaqCategoryEditor({
  category,
  allCategories,
}: {
  category: FaqCategoryWithItems;
  allCategories: FaqCategoryWithItems[];
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(category.title);
  const [icon, setIcon] = useState(category.icon || FAQ_ICON_OPTIONS[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaving(true);
    const result = await updateFaqCategory(category.id, title, icon);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete the "${category.title}" section?`)) return;
    const result = await deleteFaqCategory(category.id);
    if (!result.success) alert(result.error);
  }

  async function handleMove(direction: "up" | "down") {
    await moveFaqCategory(category.id, direction);
  }

  return (
    <div className="faq-category-card">
      <div className="faq-category-header">
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn" onClick={() => handleMove("up")} title="Move section up">
            ↑
          </button>
          <button type="button" className="admin-btn" onClick={() => handleMove("down")} title="Move section down">
            ↓
          </button>
        </div>

        {editing ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="admin-input" style={{ maxWidth: 160 }} value={icon} onChange={(e) => setIcon(e.target.value)}>
              {FAQ_ICON_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <h3 className="faq-category-title">{category.title}</h3>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {editing ? (
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button type="button" className="admin-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete}>
            Delete Section
          </button>
        </div>
      </div>

      {error && <div className="inquire-error">{error}</div>}

      <div className="faq-category-items">
        {category.items.length === 0 && <p className="admin-hint">No questions in this section yet.</p>}
        {category.items.map((item) => (
          <FaqItemEditor key={item.id} item={item} categories={allCategories} />
        ))}
        <AddFaqForm categoryId={category.id} nextOrder={category.items.length} />
      </div>
    </div>
  );
}

function AddFaqCategoryForm({ nextOrder }: { nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState(FAQ_ICON_OPTIONS[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setSaving(true);
    const result = await createFaqCategory(title, icon, nextOrder);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setTitle("");
    setIcon(FAQ_ICON_OPTIONS[0].key);
  }

  if (!open) {
    return (
      <button type="button" className="admin-btn admin-btn--primary" onClick={() => setOpen(true)}>
        + Add Section
      </button>
    );
  }

  return (
    <div className="add-block-form">
      {error && <div className="inquire-error">{error}</div>}
      <div className="admin-field">
        <label className="admin-field__label">Section Title</label>
        <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Getting Your Puppy" />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Icon</label>
        <select className="admin-input" value={icon} onChange={(e) => setIcon(e.target.value)}>
          {FAQ_ICON_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "Add"}
        </button>
        <button type="button" className="admin-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ComingSoonCard({ title }: { title: string }) {
  return (
    <div className="profile-card">
      <h2 className="admin-card__title">{title}</h2>
      <p className="admin-hint">
        This section isn&apos;t built yet - it&apos;s here as a placeholder in the navigation, matching the
        approved framework, but nothing here is functional yet.
      </p>
    </div>
  );
}

export default function WebsiteEditorClient({ blocksByPage, faqCategories, recentChanges, mediaItems }: WebsiteEditorClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);

  const sectionCount = (page: ContentPage) =>
    page === "faq" ? faqCategories.reduce((sum, c) => sum + c.items.length, 0) : (blocksByPage[page] || []).length;

  return (
    <div>
      <div className="website-tabs">
        {(
          [
            { key: "content", label: "Content" },
            { key: "navigation", label: "Navigation" },
            { key: "seo", label: "SEO Settings" },
            { key: "media", label: "Media Library" },
            { key: "settings", label: "Site Settings" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            className={`website-tab${activeTab === t.key ? " active" : ""}`}
            onClick={() => {
              setActiveTab(t.key);
              setSelectedPage(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "content" && selectedPage && (
        <div>
          <button type="button" className="website-back-link" onClick={() => setSelectedPage(null)}>
            ← Back to Website Pages
          </button>
          <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
            {WEBSITE_PAGES.find((p) => p.key === selectedPage)?.label}
          </h2>
          <p className="admin-hint" style={{ marginBottom: 16 }}>
            {WEBSITE_PAGES.find((p) => p.key === selectedPage)?.description}
          </p>

          {selectedPage === "faq" ? (
            <div>
              {faqCategories.length === 0 && (
                <p className="admin-hint" style={{ marginBottom: 12 }}>
                  No FAQ sections yet. Add one below.
                </p>
              )}
              {faqCategories.map((category) => (
                <FaqCategoryEditor key={category.id} category={category} allCategories={faqCategories} />
              ))}
              <AddFaqCategoryForm nextOrder={faqCategories.length} />
            </div>
          ) : (
            <div>
              {(blocksByPage[selectedPage] || []).length === 0 && (
                <p className="admin-hint" style={{ marginBottom: 12 }}>
                  No fields yet for this page. Add one below.
                </p>
              )}
              {(blocksByPage[selectedPage] || []).map((block) =>
                block.content_type === "text" ? (
                  <TextBlockEditor key={block.id} block={block} />
                ) : (
                  <ImageBlockEditor key={block.id} block={block} />
                )
              )}
              <AddBlockForm page={selectedPage} nextOrder={(blocksByPage[selectedPage] || []).length} />
            </div>
          )}
        </div>
      )}

      {activeTab === "content" && !selectedPage && (
        <div className="website-3col">
          <div className="profile-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h2 className="admin-card__title" style={{ margin: 0 }}>
                Website Pages
              </h2>
            </div>
            <p className="admin-hint" style={{ marginBottom: 12 }}>
              Edit any page content
            </p>
            {WEBSITE_PAGES.map((p) => (
              <div key={p.key} className="website-page-row" onClick={() => setSelectedPage(p.key)}>
                <PageIcon icon={p.icon} />
                <div className="website-page-body">
                  <div className="website-page-title">{p.label}</div>
                  <div className="website-page-desc">{p.description}</div>
                </div>
                <div className="website-page-count">
                  {sectionCount(p.key)} {p.key === "faq" ? "questions" : "sections"}
                </div>
                <span className="website-page-chevron">›</span>
              </div>
            ))}
          </div>

          <div className="profile-card">
            <h2 className="admin-card__title">Homepage Preview</h2>
            <p className="admin-hint" style={{ marginBottom: 10 }}>
              Illustrative only for now - not yet a live, dynamic preview of your saved content. That comes in a
              later step, once the live site is wired to read from here.
            </p>
            <div className="website-preview-frame">
              <div className="website-preview-note">Static preview - not live</div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#111827", marginBottom: 4 }}>
                  Find Your <span style={{ color: "#1B7BFF" }}>New Bestie</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                  Real puppies. Clear prices. Simple help from start to home.
                </div>
                <div
                  style={{
                    background: "#1B7BFF",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "inline-block",
                  }}
                >
                  View Puppies ›
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="profile-card">
              <h2 className="admin-card__title">Quick Actions</h2>
              <button type="button" className="website-quick-action" onClick={() => setActiveTab("media")}>
                ⬆ Upload Image
              </button>
              <button
                type="button"
                className="website-quick-action"
                onClick={() => setSelectedPage("homepage")}
              >
                + Add New Section
              </button>
              <button type="button" className="website-quick-action" onClick={() => setActiveTab("navigation")}>
                ≡ Edit Navigation
              </button>
              <button type="button" className="website-quick-action" disabled title="Not built yet">
                ⤓ Backup Website (soon)
              </button>
            </div>

            <div className="profile-card">
              <h2 className="admin-card__title">Recent Changes</h2>
              {recentChanges.length === 0 ? (
                <p className="admin-hint">No changes yet.</p>
              ) : (
                recentChanges.map((c) => (
                  <div key={c.id} className="recent-change-row">
                    <span className="recent-change-dot" />
                    <span>{c.label}</span>
                    <span className="recent-change-time">{formatRelativeTime(c.updatedAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="profile-card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 className="admin-card__title" style={{ margin: 0 }}>
                Media Library (Recent)
              </h2>
              <button type="button" className="website-back-link" onClick={() => setActiveTab("media")}>
                View All Media →
              </button>
            </div>
            <div className="media-grid">
              {mediaItems.slice(0, 7).map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <div key={m.id} className="media-grid-item">
                  <img src={m.imageUrl} alt={m.label} />
                </div>
              ))}
              <div className="media-grid-upload" onClick={() => setSelectedPage("homepage")}>
                + Upload More
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "media" && (
        <div className="profile-card">
          <h2 className="admin-card__title">Media Library</h2>
          {mediaItems.length === 0 ? (
            <p className="admin-hint">No images uploaded yet. Add an image field to a page to upload one.</p>
          ) : (
            <div className="media-grid">
              {mediaItems.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <div key={m.id} className="media-grid-item">
                  <img src={m.imageUrl} alt={m.label} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "navigation" && <ComingSoonCard title="Navigation" />}
      {activeTab === "seo" && <ComingSoonCard title="SEO Settings" />}
      {activeTab === "settings" && <ComingSoonCard title="Site Settings" />}
    </div>
  );
}
