"use client";

import { useMemo, useState } from "react";
import type { HomepagePuppy } from "../../../lib/public-data/homepage";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#22C55E" },
  hold: { label: "Pending Adoption", color: "#F59E0B" },
  sold: { label: "Sold", color: "#EF4444" },
  on_sale: { label: "On Sale", color: "#F97316" },
  discounted: { label: "Discounted", color: "#A855F7" },
};

type Filter = "all" | "yorkie" | "maltipoo" | "male" | "female" | "under800";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "yorkie", label: "Yorkie" },
  { key: "maltipoo", label: "Maltipoo" },
  { key: "male", label: "♂ Male" },
  { key: "female", label: "♀ Female" },
  { key: "under800", label: "Under $800" },
];

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

export default function PuppyGrid({ puppies }: { puppies: HomepagePuppy[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return puppies.filter((p) => {
      const matchesSearch = search.trim() === "" || p.breed.toLowerCase().includes(search.trim().toLowerCase());
      if (!matchesSearch) return false;

      switch (filter) {
        case "yorkie":
          return p.breed.toLowerCase().includes("yorkie");
        case "maltipoo":
          return p.breed.toLowerCase().includes("maltipoo");
        case "male":
          return p.gender === "male";
        case "female":
          return p.gender === "female";
        case "under800":
          return (p.salePriceCents || p.priceCents) / 100 < 800;
        default:
          return true;
      }
    });
  }, [puppies, search, filter]);

  return (
    <>
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by breed..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-chip${filter === f.key ? " pp-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="results-info">
        Showing <span>{filtered.length}</span> puppies
      </div>

      <div className="puppy-grid">
        {filtered.map((p) => {
          const badge = STATUS_BADGE[p.status] || STATUS_BADGE.available;
          return (
            <a key={p.id} className="pcard" href={`/puppies/${p.slug}`}>
              <div className="pcard-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl} alt={p.breed} />
                <span className="pcard-tag" style={{ background: badge.color }}>
                  {badge.label}
                </span>
              </div>
              <div className="pcard-body">
                <div className="pcard-name">{p.name || p.breed}</div>
                <div className="pcard-meta">
                  {p.ageWeeks ?? "—"} wks &nbsp;·&nbsp; {p.gender === "male" ? "♂ Male" : "♀ Female"}
                </div>
                <div className="pcard-footer">
                  <span className="pcard-price">{priceDisplay(p)}</span>
                  <span className="pcard-btn">Details ›</span>
                </div>
              </div>
            </a>
          );
        })}
        {filtered.length === 0 && (
          <div className="no-results">No puppies match your search. Try a different filter! 🐶</div>
        )}
      </div>
    </>
  );
}
