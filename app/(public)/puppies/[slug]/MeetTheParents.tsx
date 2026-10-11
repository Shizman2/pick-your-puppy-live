// "Meet the Parents" on the puppy detail page: the optional single Mom / Dad
// photos (never part of photo_urls). Renders nothing when neither exists;
// a lone parent is shown centered rather than as half of a two-column row.

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5" ry="4.2" fill="currentColor" />
      <ellipse cx="5.6" cy="10.4" rx="2.1" ry="2.6" fill="currentColor" />
      <ellipse cx="9.5" cy="6.6" rx="2.1" ry="2.7" fill="currentColor" />
      <ellipse cx="14.5" cy="6.6" rx="2.1" ry="2.7" fill="currentColor" />
      <ellipse cx="18.4" cy="10.4" rx="2.1" ry="2.6" fill="currentColor" />
    </svg>
  );
}

function ParentCard({ kind, url }: { kind: "mom" | "dad"; url: string }) {
  const label = kind === "mom" ? "Mom" : "Dad";
  return (
    <figure className={`parents-card parents-card--${kind}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Puppy's ${label.toLowerCase()}`} />
      <figcaption className="parents-card-label">
        <span className="parents-card-symbol" aria-hidden="true">
          {kind === "mom" ? "♀" : "♂"}
        </span>
        {label}
      </figcaption>
    </figure>
  );
}

export default function MeetTheParents({
  motherUrl,
  fatherUrl,
}: {
  motherUrl?: string | null;
  fatherUrl?: string | null;
}) {
  if (!motherUrl && !fatherUrl) return null;
  const single = !motherUrl || !fatherUrl;

  return (
    <section className="parents-section" aria-labelledby="meet-the-parents-heading">
      <h2 id="meet-the-parents-heading" className="parents-heading">
        <PawIcon />
        Meet the Parents
      </h2>
      <div className={`parents-grid${single ? " parents-grid--single" : ""}`}>
        {motherUrl && <ParentCard kind="mom" url={motherUrl} />}
        {fatherUrl && <ParentCard kind="dad" url={fatherUrl} />}
      </div>
    </section>
  );
}
