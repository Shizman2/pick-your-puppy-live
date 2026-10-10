import type { HomepagePuppy } from "../../../lib/public-data/homepage";
import PuppyCard from "../../../components/public-site/PuppyCard";

export default function FeaturedPuppies({ puppies }: { puppies: HomepagePuppy[] }) {
  if (puppies.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13, fontWeight: 600 }}>
        No puppies available right now — check back soon!
      </div>
    );
  }

  // Same card and 2-column grid as /puppies; the section already supplies
  // the side padding, hence the flush modifier.
  return (
    <div className="puppy-grid puppy-grid--flush">
      {puppies.map((p) => (
        <PuppyCard key={p.id} puppy={p} />
      ))}
    </div>
  );
}
