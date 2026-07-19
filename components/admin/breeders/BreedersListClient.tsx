import Link from "next/link";
import type { BreederRow } from "../../../lib/breederTypes";

export default function BreedersListClient({ breeders }: { breeders: BreederRow[] }) {
  if (breeders.length === 0) {
    return <div className="contacts-empty">No breeders yet. Click &quot;+ Add Breeder&quot; to add one.</div>;
  }

  return (
    <div>
      {breeders.map((b) => (
        <Link key={b.id} href={`/admin/breeders/${b.id}`} className="breeder-card">
          <div className="breeder-card-name">{b.name}</div>
          <div className="breeder-card-meta">
            {[b.phone, b.email, b.location].filter(Boolean).join(" · ") || "No contact info"}
          </div>
          {b.breeds.length > 0 && (
            <div className="breeder-card-breeds">
              {b.breeds.map((breed) => (
                <span key={breed} className="breeder-breed-pill">
                  {breed}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
