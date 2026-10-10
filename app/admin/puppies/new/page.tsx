import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import PuppyForm, { type PuppyDuplicateValues } from "../../../../components/admin/puppies/PuppyForm";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadConversationCount } from "../../../../lib/unreadCount";
import { getAllBreedersForSelect } from "../../../../lib/breeders";
import { getPuppyById } from "../../../../lib/puppies";
import type { PuppyRow } from "../../../../lib/puppyTypes";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/puppies/puppies.css";
import "../../../../components/admin/sales/sales.css";

export const dynamic = "force-dynamic";

// Only reusable listing configuration is carried over. Name, photos, status,
// slug, sold_at, microchip, ids and timestamps are left out on purpose, and
// nothing linked to the original (sales, favorites, inquiries, documents,
// analytics) is read at all.
function toDuplicateValues(p: PuppyRow): PuppyDuplicateValues {
  return {
    breed: p.breed,
    price_cents: p.price_cents,
    sale_price_cents: p.sale_price_cents,
    show_on_website: p.show_on_website,
    gender: p.gender,
    date_of_birth: p.date_of_birth,
    size: p.size,
    badge_tag: p.badge_tag,
    description: p.description,
    color: p.color,
    registration: p.registration,
    vet_checked: p.vet_checked,
    vaccinated: p.vaccinated,
    delivery_available: p.delivery_available,
    is_featured: p.is_featured,
    display_order: p.display_order,
    breeder_id: p.breeder_id,
    cost_cents: p.cost_cents,
    bundle_cost_cents: p.bundle_cost_cents,
    location: p.location,
  };
}

export default async function NewPuppyPage({ searchParams }: { searchParams: { duplicateFrom?: string } }) {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadConversationCount();
  const breeders = await getAllBreedersForSelect();

  const duplicateFrom = searchParams.duplicateFrom;
  let source: PuppyRow | null = null;
  let sourceError: string | null = null;
  if (duplicateFrom) {
    try {
      source = await getPuppyById(duplicateFrom);
      if (!source) sourceError = "The puppy you tried to duplicate wasn't found.";
    } catch (err) {
      sourceError = err instanceof Error ? err.message : "Couldn't load the puppy to duplicate.";
    }
  }

  return (
    <AdminSidebar active="puppies" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">{source ? `Duplicating: ${source.name}` : "Add Puppy"}</h1>
            {source && (
              <p className="contacts-subtitle">Update the information below to create a new puppy listing.</p>
            )}
            <p className="contacts-subtitle">
              <Link href={source ? `/admin/puppies/${source.id}` : "/admin/puppies"} className="contacts-back-link">
                {source ? `← Back to ${source.name}` : "← Back to Puppies"}
              </Link>
            </p>
          </div>
        </div>
        {sourceError && (
          <div className="inquire-error" style={{ maxWidth: 560 }}>
            {sourceError} Starting a blank puppy instead.
          </div>
        )}
        <PuppyForm
          key={source?.id || "new"}
          breeders={breeders}
          duplicateValues={source ? toDuplicateValues(source) : undefined}
          cancelHref={source ? `/admin/puppies/${source.id}` : undefined}
        />
      </div>
    </AdminSidebar>
  );
}
