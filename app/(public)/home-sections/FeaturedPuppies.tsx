import type { HomepagePuppy } from "../../../lib/public-data/homepage";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#22C55E" },
  hold: { label: "Pending Adoption", color: "#F59E0B" },
  sold: { label: "Sold", color: "#EF4444" },
  on_sale: { label: "On Sale", color: "#F97316" },
  discounted: { label: "Discounted", color: "#A855F7" },
};

function priceDisplay(puppy: HomepagePuppy) {
  const price = Math.round(puppy.priceCents / 100);
  if (puppy.salePriceCents) {
    const sale = Math.round(puppy.salePriceCents / 100);
    return (
      <>
        <span style={{ textDecoration: "line-through", color: "#9CA3AF", fontWeight: 700, fontSize: 12, marginRight: 6 }}>
          ${price}
        </span>
        <span>${sale}</span>
      </>
    );
  }
  return <>${price}</>;
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
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="puppy-card-img" src={p.photoUrl} alt={p.breed} />
              <span className="pcard-tag" style={{ background: badge.color }}>
                {badge.label}
              </span>
            </div>
            <div className="puppy-card-body">
              <div className="puppy-card-name">{p.name || p.breed}</div>
              <div className="puppy-card-breed">{p.breed}</div>
              <div className="puppy-card-meta">
                📅 {p.ageWeeks ?? "—"} wks old &nbsp;|&nbsp; {p.gender === "male" ? "♂ Male" : "♀ Female"}
              </div>
              <div className="puppy-card-price">{priceDisplay(p)}</div>
              <span className="btn-details">See Details ›</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
