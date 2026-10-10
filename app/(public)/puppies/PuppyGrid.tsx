"use client";

import { useMemo, useState } from "react";
import type { HomepagePuppy } from "../../../lib/public-data/homepage";
import PuppyCard from "../../../components/public-site/PuppyCard";

type Filter = "all" | "yorkie" | "maltipoo" | "male" | "female" | "under800";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "yorkie", label: "Yorkie" },
  { key: "maltipoo", label: "Maltipoo" },
  { key: "male", label: "♂ Male" },
  { key: "female", label: "♀ Female" },
  { key: "under800", label: "Under $800" },
];

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
        {filtered.map((p) => (
          <PuppyCard key={p.id} puppy={p} />
        ))}
        {filtered.length === 0 && (
          <div className="no-results">No puppies match your search. Try a different filter! 🐶</div>
        )}
      </div>
    </>
  );
}
