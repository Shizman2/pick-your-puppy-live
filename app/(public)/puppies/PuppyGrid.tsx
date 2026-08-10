"use client";

import { useMemo, useState } from "react";
import type { HomepagePuppy } from "../../../lib/public-data/homepage";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#16A34A" },
  hold: { label: "Pending Adoption", color: "#D97706" },
  sold: { label: "Sold", color: "#6B7280" },
  on_sale: { label: "On Sale", color: "#EA580C" },
  discounted: { label: "On Sale", color: "#EA580C" },
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

function Watermark() {
  return (
    <svg className="pcard-watermark" width="28" height="28" viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="15.5" stroke="white" strokeWidth="1.3" opacity="0.9" />
      <path
        d="M12.5 14.2c.7 0 1.3-.8 1.3-1.8s-.6-1.8-1.3-1.8-1.3.8-1.3 1.8.6 1.8 1.3 1.8zM21.5 14.2c.7 0 1.3-.8 1.3-1.8s-.6-1.8-1.3-1.8-1.3.8-1.3 1.8.6 1.8 1.3 1.8zM9.6 18.4c.6 0 1.1-.7 1.1-1.6s-.5-1.6-1.1-1.6-1.1.7-1.1 1.6.5 1.6 1.1 1.6zM24.4 18.4c.6 0 1.1-.7 1.1-1.6s-.5-1.6-1.1-1.6-1.1.7-1.1 1.6.5 1.6 1.1 1.6z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M17 17.6c-2.4 0-5.2 1.6-5.2 3.9 0 1.4 1.5 2.5 2.9 2.1.7-.2 1.5-.4 2.3-.4s1.6.2 2.3.4c1.4.4 2.9-.7 2.9-2.1 0-2.3-2.8-3.9-5.2-3.9z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="pcard-heart" width="17" height="17" viewBox="0 0 24 24" fill="none">
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
      <span className="pcard-price on-sale">
        <span className="original">${price}</span>${sale}
      </span>
    );
  }
  return <span className="pcard-price">${price}</span>;
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
                <Watermark />
              </div>
              <div className="pcard-body">
                <div className="pcard-top-row">
                  <span className="pcard-status-badge" style={{ background: badge.color }}>
                    {badge.label}
                  </span>
                  <HeartIcon />
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
          );
        })}
        {filtered.length === 0 && (
          <div className="no-results">No puppies match your search. Try a different filter! 🐶</div>
        )}
      </div>
    </>
  );
}
