interface PublishControlsProps {
  status: "draft" | "published" | "unpublished";
  onSaveDraft: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  busy: boolean;
}

export default function PublishControls({
  status,
  onSaveDraft,
  onPublish,
  onUnpublish,
  busy,
}: PublishControlsProps) {
  return (
    <div>
      <div className="admin-hint" style={{ marginBottom: "10px" }}>
        Current status: <strong>{status}</strong>
        {status === "draft" && " — settings are saved, but the public page isn't visible yet."}
        {status === "published" && " — the public page is live and following the Scheduled/Countdown/Live rules."}
        {status === "unpublished" && " — the public page is taken down, but your settings are kept."}
      </div>
      <div className="admin-save-bar">
        <button type="button" className="admin-btn" onClick={onSaveDraft} disabled={busy}>
          {busy ? "Saving..." : "Save draft"}
        </button>
        {status === "published" ? (
          <button type="button" className="admin-btn admin-btn--danger" onClick={onUnpublish} disabled={busy}>
            Unpublish
          </button>
        ) : (
          <button type="button" className="admin-btn admin-btn--primary" onClick={onPublish} disabled={busy}>
            Publish
          </button>
        )}
      </div>
    </div>
  );
}
