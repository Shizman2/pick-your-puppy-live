import Link from "next/link";
import type { BreedRow } from "../../../lib/breedTypes";

export default function BreedsListClient({ breeds }: { breeds: BreedRow[] }) {
  if (breeds.length === 0) {
    return <div className="contacts-empty">No breeds yet. Click &quot;+ Add Breed&quot; to add one.</div>;
  }

  return (
    <div>
      {breeds.map((b) => (
        <Link key={b.id} href={`/admin/breeds/${b.id}`} className="breed-card">
          <div className="breed-card-name">{b.name}</div>
          <div className="breed-card-meta">
            {b.expected_adult_size || "No expected adult size set"}
          </div>
        </Link>
      ))}
    </div>
  );
}
