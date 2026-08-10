import type { HomepagePuppy } from "../../../lib/public-data/homepage";

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

function HeartIcon() {
  return (
    <svg className="pcard-heart" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
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
          <a key={p.id} className="puppy-card" href={`/puppies/${p.slug}`}>
            <div className="puppy-card-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="puppy-card-img" src={p.photoUrl} alt={p.breed} />
              <Watermark />
            </div>
            <div className="puppy-card-body">
              <div className="pcard-top-row">
                <span className="pcard-status-badge" style={{ background: badge.color }}>
                  {badge.label}
                </span>
                <HeartIcon />
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
        );
      })}
    </div>
  );
}
