import "./spotlightCard.css";
import type { SpotlightPuppy } from "../../lib/public-data/homepage";

// Full-width "Special Opportunity" card on /puppies (Puppy Spotlight). Spans
// the whole .puppy-grid row; deliberately not a PuppyCard. Yellow/gold card,
// red ribbon / LIMITED TIME / price, navy name, yellow CTA.

function formatDollars(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5" ry="4.2" fill="currentColor" />
      <ellipse cx="5.6" cy="10.4" rx="2.1" ry="2.6" fill="currentColor" />
      <ellipse cx="9.5" cy="6.6" rx="2.1" ry="2.7" fill="currentColor" />
      <ellipse cx="14.5" cy="6.6" rx="2.1" ry="2.7" fill="currentColor" />
      <ellipse cx="18.4" cy="10.4" rx="2.1" ry="2.6" fill="currentColor" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor" />
    </svg>
  );
}

export default function SpotlightCard({ puppy: p }: { puppy: SpotlightPuppy }) {
  const name = p.name || p.breed;
  const headline = p.headline || "Special Opportunity";
  const [firstWord, ...rest] = headline.split(" ");

  return (
    <article className="spotlight-card" aria-label={`${headline}: ${name}`}>
      <a className="spotlight-photo" href={`/puppies/${p.slug}`} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photoUrl} alt="" />
        <span className="spotlight-ribbon">
          <PawIcon />
          <span className="spotlight-ribbon-text">
            <span className="spotlight-ribbon-big">{firstWord}</span>
            {rest.length > 0 && <span className="spotlight-ribbon-small">{rest.join(" ")}</span>}
          </span>
        </span>
      </a>

      <div className="spotlight-info">
        <div className="spotlight-limited">
          <Sparkle />
          <span className="spotlight-limited-line" />
          <span className="spotlight-limited-text">Limited Time</span>
          <span className="spotlight-limited-line" />
        </div>

        <h3 className="spotlight-name">{name}</h3>
        <div className="spotlight-meta">
          {p.breed} <span aria-hidden="true">•</span> {p.gender === "male" ? "Male" : "Female"}
          {p.ageWeeks !== null && (
            <>
              {" "}
              <span aria-hidden="true">•</span> {p.ageWeeks} wks
            </>
          )}
        </div>

        <div className="spotlight-price">{formatDollars(p.specialPriceCents)}</div>

        <p className="spotlight-message">
          {p.message || (
            <>
              Special pricing for the right family. {name} is available at a special price{" "}
              <span className="spotlight-message-accent">for a limited time.</span>
            </>
          )}
        </p>

        <a className="spotlight-cta" href={`/puppies/${p.slug}`}>
          View {name} ›
        </a>
      </div>
    </article>
  );
}
