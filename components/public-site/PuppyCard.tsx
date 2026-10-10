import "./puppyCard.css";
import type { HomepagePuppy } from "../../lib/public-data/homepage";
import FavoriteButton from "../public/FavoriteButton";

// The compact vertical puppy card shared by the /puppies grid and the
// homepage Available Puppies grid, so both always render the same card.
// Render inside a `.puppy-grid` container.

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#16A34A" },
  hold: { label: "Pending Adoption", color: "#D97706" },
  sold: { label: "Sold", color: "#6B7280" },
  on_sale: { label: "On Sale", color: "#EA580C" },
  discounted: { label: "On Sale", color: "#EA580C" },
};

function Watermark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="pcard-watermark" src="/watermark-logo.png" alt="" />;
}

function PriceBlock({ puppy }: { puppy: HomepagePuppy }) {
  const price = Math.round(puppy.priceCents / 100);
  if (puppy.salePriceCents) {
    const sale = Math.round(puppy.salePriceCents / 100);
    return (
      <span className="pcard-price on-sale">
        <span className="original">${price}</span>${sale}
      </span>
    );
  }
  return <span className="pcard-price">${price}</span>;
}

export default function PuppyCard({ puppy: p }: { puppy: HomepagePuppy }) {
  const badge = STATUS_BADGE[p.status] || STATUS_BADGE.available;
  return (
    <div className="pcard">
      <a className="pcard-link" href={`/puppies/${p.slug}`}>
        <div className="pcard-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photoUrl} alt={p.breed} />
          <Watermark />
          {p.location && (
            <span className="pcard-location">
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
                <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" fill="#1B7BFF" />
                <circle cx="12" cy="9" r="2.4" fill="#fff" />
              </svg>
              {p.location}
            </span>
          )}
        </div>
        <div className="pcard-body">
          <div className="pcard-top-row">
            <span className="pcard-status-badge" style={{ background: badge.color }}>
              {badge.label}
            </span>
          </div>
          <div className="pcard-name">{p.name || p.breed}</div>
          <div className="pcard-breed">{p.breed}</div>
          <div className="pcard-meta">
            <span>{p.gender === "male" ? "Male" : "Female"}</span>
            <span className="sep">|</span>
            <span>{p.ageWeeks ?? "—"} wks</span>
          </div>
          <div className="pcard-footer">
            <PriceBlock puppy={p} />
            <span className="pcard-btn">Details ›</span>
          </div>
        </div>
      </a>
      {/* Sibling of the <a>, not nested inside it - a <button>
          inside an <a> is invalid HTML content model and was
          unreliable for click handling across browsers. */}
      <div className="pcard-heart-overlay">
        <FavoriteButton puppyId={p.id} initialCount={p.favoritesCount} />
      </div>
    </div>
  );
}
