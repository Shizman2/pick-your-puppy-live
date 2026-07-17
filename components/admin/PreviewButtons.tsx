interface PreviewButtonsProps {
  slug: string;
}

/**
 * Each button opens the real public page with a ?preview= override.
 * The server only honors that override for a logged-in admin session
 * (see app/show/[slug]/page.tsx) - it does not change the real event
 * status, and the Live preview never reveals the actual destination link.
 */
export default function PreviewButtons({ slug }: PreviewButtonsProps) {
  const states: { key: string; label: string }[] = [
    { key: "scheduled", label: "Scheduled" },
    { key: "countdown", label: "Countdown" },
    { key: "live", label: "Live" },
  ];

  return (
    <div className="admin-field">
      <div className="admin-preview-row">
        {states.map((s) => (
          <a
            key={s.key}
            href={`/show/${slug}?preview=${s.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn"
            style={{ display: "block", textAlign: "center" }}
          >
            {s.label}
          </a>
        ))}
      </div>
      <p className="admin-hint">
        Opens the real page in each state without changing anything. Only
        works while you&apos;re logged in - visitors without an admin
        session are shown the real current state instead.
      </p>
    </div>
  );
}
