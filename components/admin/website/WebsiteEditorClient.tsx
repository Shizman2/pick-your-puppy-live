"use client";

import { useRef, useState } from "react";
import {
  createContentBlock,
  updateContentBlockText,
  deleteContentBlock,
  uploadContentImage,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
} from "../../../app/admin/website/actions";
import { CONTENT_PAGES, type ContentBlockRow, type ContentPage, type ContentType, type FaqItemRow } from "../../../lib/contentTypes";

interface WebsiteEditorClientProps {
  blocksByPage: Record<ContentPage, ContentBlockRow[]>;
  faqItems: FaqItemRow[];
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
        <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete} style={{ padding: "4px 10px", fontSize: 11 }}>
          Remove
        </button>
      </div>
      <textarea className="admin-textarea" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
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
        <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete} style={{ padding: "4px 10px", fontSize: 11 }}>
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
    const result = await createContentBlock({
      page,
      sectionKey,
      label,
      contentType,
      textValue,
      displayOrder: nextOrder,
    });
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
        <input className="admin-input" placeholder="e.g. hero_headline" value={sectionKey} onChange={(e) => setSectionKey(e.target.value)} />
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

function FaqItemEditor({ item }: { item: FaqItemRow }) {
  const [question, setQuestion] = useState(item.question);
  const [answer, setAnswer] = useState(item.answer);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateFaqItem(item.id, question, answer);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleDelete() {
    if (!confirm("Delete this FAQ item?")) return;
    await deleteFaqItem(item.id);
  }

  return (
    <div className="faq-item-card">
      <div className="admin-field">
        <label className="admin-field__label">Question</label>
        <input className="admin-input" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Answer</label>
        <textarea className="admin-textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} />
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

function AddFaqForm({ nextOrder }: { nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setSaving(true);
    const result = await createFaqItem(question, answer, nextOrder);
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
        + Add FAQ
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

export default function WebsiteEditorClient({ blocksByPage, faqItems }: WebsiteEditorClientProps) {
  const [activeTab, setActiveTab] = useState<ContentPage | "faq">("homepage");

  return (
    <div>
      <div className="website-tabs">
        {CONTENT_PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`website-tab${activeTab === p.key ? " active" : ""}`}
            onClick={() => setActiveTab(p.key)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`website-tab${activeTab === "faq" ? " active" : ""}`}
          onClick={() => setActiveTab("faq")}
        >
          FAQ
        </button>
      </div>

      {activeTab !== "faq" ? (
        <div>
          {(blocksByPage[activeTab] || []).length === 0 && (
            <p className="admin-hint" style={{ marginBottom: 12 }}>
              No fields yet for this page. Add one below.
            </p>
          )}
          {(blocksByPage[activeTab] || []).map((block) =>
            block.content_type === "text" ? (
              <TextBlockEditor key={block.id} block={block} />
            ) : (
              <ImageBlockEditor key={block.id} block={block} />
            )
          )}
          <AddBlockForm page={activeTab} nextOrder={(blocksByPage[activeTab] || []).length} />
        </div>
      ) : (
        <div>
          {faqItems.length === 0 && (
            <p className="admin-hint" style={{ marginBottom: 12 }}>
              No FAQ items yet. Add one below.
            </p>
          )}
          {faqItems.map((item) => (
            <FaqItemEditor key={item.id} item={item} />
          ))}
          <AddFaqForm nextOrder={faqItems.length} />
        </div>
      )}
    </div>
  );
}
