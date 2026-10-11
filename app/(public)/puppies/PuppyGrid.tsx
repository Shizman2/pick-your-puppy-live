"use client";

import { useMemo, useState } from "react";
import type { HomepagePuppy, SpotlightPuppy } from "../../../lib/public-data/homepage";
import PuppyCard from "../../../components/public-site/PuppyCard";
import SpotlightCard from "../../../components/public-site/SpotlightCard";

type Filter = "all" | "male" | "female" | "under1000" | "specials";

// The Special Opportunity is placed after this many normal cards (2 rows).
const SPOTLIGHT_AFTER = 4;
const UNDER_LIMIT_CENTS = 1000 * 100;

export default function PuppyGrid({ puppies, spotlight }: { puppies: HomepagePuppy[]; spotlight: SpotlightPuppy | null }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // "Specials" only exists while there is an active Special Opportunity.
  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "male", label: "Male" },
    { key: "female", label: "Female" },
    { key: "under1000", label: "Under $1,000" },
    ...(spotlight ? [{ key: "specials" as Filter, label: "Specials 🔥" }] : []),
  ];
  const activeFilter: Filter = filter === "specials" && !spotlight ? "all" : filter;

  // priceCents = the customer-facing price: the special price for the
  // spotlight puppy, otherwise the sale price if set, else the normal price.
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (p: HomepagePuppy, priceCents: number, isSpecial: boolean) => {
      if (term && !p.breed.toLowerCase().includes(term)) return false;
      switch (activeFilter) {
        case "male":
          return p.gender === "male";
        case "female":
          return p.gender === "female";
        case "under1000":
          return priceCents < UNDER_LIMIT_CENTS;
        case "specials":
          return isSpecial;
        default:
          return true;
      }
    };
  }, [search, activeFilter]);

  const filtered = useMemo(
    () => puppies.filter((p) => matches(p, p.salePriceCents || p.priceCents, false)),
    [puppies, matches]
  );
  const showSpotlight = !!spotlight && matches(spotlight, spotlight.specialPriceCents, true);
  // Unique puppies: the spotlight puppy is never also in `filtered`.
  const count = filtered.length + (showSpotlight ? 1 : 0);
  // After the first 2 full rows; with fewer puppies, after the last FULL row so
  // the grid never leaves an empty slot before the full-width card.
  const spotlightAt = Math.min(SPOTLIGHT_AFTER, filtered.length - (filtered.length % 2));

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
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-chip${f.key === "specials" ? " filter-chip--specials" : ""}${activeFilter === f.key ? " pp-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="results-info">
        Showing <span>{count}</span> {count === 1 ? "puppy" : "puppies"}
      </div>

      <div className="puppy-grid">
        {filtered.slice(0, spotlightAt).map((p) => (
          <PuppyCard key={p.id} puppy={p} />
        ))}
        {showSpotlight && spotlight && <SpotlightCard puppy={spotlight} />}
        {filtered.slice(spotlightAt).map((p) => (
          <PuppyCard key={p.id} puppy={p} />
        ))}
        {count === 0 && (
          <div className="no-results">No puppies match your search. Try a different filter! 🐶</div>
        )}
      </div>
    </>
  );
}
