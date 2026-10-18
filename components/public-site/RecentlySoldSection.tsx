import "./recentlySold.css";
import type { HomepagePuppy } from "../../lib/public-data/homepage";

// "Recently Found Their Homes" - sold puppies shown after the active
// inventory. Deliberately not the active PuppyCard: no price, location,
// favorites or Details button, and the whole card links to the existing
// detail page. Renders nothing when there are no qualifying puppies.

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

/** Real sold_at date, in the business's (Eastern) time zone, e.g. "Oct 18". */
function formatSoldDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
}

function SoldPuppyCard({ puppy: p }: { puppy: HomepagePuppy }) {
  const name = p.name || p.breed;
  return (
    <a className="sold-card" href={`/puppies/${p.slug}`} aria-label={`${name} found a forever home`}>
      <div className="sold-card-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photoUrl} alt={p.breed} />
        <div className="sold-card-overlay">
          <span>
            Found My
            <br />
            <span className="sold-card-overlay-line">Forever Home! ❤️</span>
          </span>
        </div>
      </div>
      <div className="sold-card-body">
        <div className="sold-card-name">{name}</div>
        <div className="sold-card-breed">{p.breed}</div>
        <div className="sold-card-meta">
          <span>{p.gender === "male" ? "Male" : "Female"}</span>
          <span className="sep">|</span>
          <span>{p.ageWeeks ?? "—"} wks</span>
        </div>
        {p.soldAt && <div className="sold-card-date">Sold {formatSoldDate(p.soldAt)}</div>}
      </div>
    </a>
  );
}

export default function RecentlySoldSection({ puppies }: { puppies: HomepagePuppy[] }) {
  if (puppies.length === 0) return null;

  return (
    <>
      <div className="sold-divider" aria-hidden="true">
        <span className="sold-divider-line" />
        <PawIcon />
        <span className="sold-divider-line" />
      </div>
      <section className="sold-section" aria-labelledby="recently-sold-heading">
        <h2 id="recently-sold-heading" className="sold-section-title">
          ❤️ Recently Found Their Homes ❤️
        </h2>
        <p className="sold-section-sub">These puppies have already found their families.</p>
        <div className="sold-grid">
          {puppies.map((p) => (
            <SoldPuppyCard key={p.id} puppy={p} />
          ))}
        </div>
      </section>
    </>
  );
}
