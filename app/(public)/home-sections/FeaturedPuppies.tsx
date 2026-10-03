import type { HomepagePuppy } from "../../../lib/public-data/homepage";
import FavoriteButton from "../../../components/public/FavoriteButton";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#16A34A" }, // green = Available
  hold: { label: "Pending Adoption", color: "#D97706" }, // amber = Pending
  sold: { label: "Sold", color: "#6B7280" },
  on_sale: { label: "On Sale", color: "#EA580C" }, // orange-red = On Sale
  discounted: { label: "On Sale", color: "#EA580C" },
};

function Watermark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="puppy-card-watermark" src="/watermark-logo.png" alt="" />;
}

function PriceBlock({ puppy }: { puppy: HomepagePuppy }) {
  const price = Math.round(puppy.priceCents / 100);
  if (puppy.salePriceCents) {
    const sale = Math.round(puppy.salePriceCents / 100);
    return (
      <div className="puppy-card-price on-sale">
        <span className="original">${price}</span>${sale}
      </div>
    );
  }
  return <div className="puppy-card-price">${price}</div>;
}

export default function FeaturedPuppies({ puppies }: { puppies: HomepagePuppy[] }) {
  if (puppies.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13, fontWeight: 600 }}>
        No puppies available right now — check back soon!
      </div>
    );
  }

  return (
    <div>
      {puppies.map((p) => {
        const badge = STATUS_BADGE[p.status] || STATUS_BADGE.available;
        return (
          <div key={p.id} className="puppy-card">
            <a className="puppy-card-link" href={`/puppies/${p.slug}`}>
              <div className="puppy-card-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="puppy-card-img" src={p.photoUrl} alt={p.breed} />
                <Watermark />
                {p.location && (
                  <span className="puppy-card-location">
                    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
                      <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" fill="#1B7BFF" />
                      <circle cx="12" cy="9" r="2.4" fill="#fff" />
                    </svg>
                    {p.location}
                  </span>
                )}
              </div>
              <div className="puppy-card-body">
                <div className="pcard-top-row">
                  <span className="pcard-status-badge" style={{ background: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <div className="puppy-card-name">{p.name || p.breed}</div>
                <div className="puppy-card-breed">{p.breed}</div>
                <div className="puppy-card-meta">
                  <span>{p.gender === "male" ? "Male" : "Female"}</span>
                  <span className="sep">|</span>
                  <span>{p.ageWeeks ?? "—"} wks old</span>
                </div>

                <div className="pcard-bottom-row">
                  <PriceBlock puppy={p} />
                  <span className="btn-details">See Details ›</span>
                </div>
              </div>
            </a>
            {/* Sibling of the <a>, not nested inside it - a <button>
                inside an <a> is invalid HTML content model and was
                unreliable for click handling across browsers. */}
            <div className="puppy-card-heart-overlay">
              <FavoriteButton puppyId={p.id} initialCount={p.favoritesCount} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
