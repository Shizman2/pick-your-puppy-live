import { redirect } from "next/navigation";
import { requireAffiliateUser } from "../../../lib/authz";
import { getAffiliateById } from "../../../lib/affiliates";
import { getAllVisiblePuppies, mapPuppyRowToCard } from "../../../lib/public-data/puppies";
import PartnersShell from "../../../components/partners/PartnersShell";
import MarketingCenterClient from "../../../components/partners/MarketingCenterClient";
import "../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

export default async function PartnersMarketingPage() {
  const auth = await requireAffiliateUser();
  if (!auth.ok) redirect("/partners/login");

  const affiliate = await getAffiliateById(auth.affiliateId);
  if (!affiliate) redirect("/partners/login");

  // Same public-visibility rule the main /puppies grid uses
  // (show_on_website = true), plus an explicit exclusion of puppies
  // that came from a Puppy Finder conversion - those are sourced for
  // one specific customer, not public catalog inventory, and default
  // to show_on_website = false already, but this is an intentional
  // second, explicit check rather than relying on that default alone.
  const allVisible = await getAllVisiblePuppies();
  const marketablePuppies = allVisible
    .filter((p) => !p.source_puppy_finder_option_id)
    .map(mapPuppyRowToCard);

  return (
    <PartnersShell>
      <h1 className="contacts-title">Marketing &amp; Creatives</h1>
      <p className="contacts-subtitle" style={{ marginBottom: 16 }}>
        Ready-to-share links and captions for available puppies and Puppy Finder.
      </p>
      <MarketingCenterClient referralCode={affiliate.referral_code} puppies={marketablePuppies} />
    </PartnersShell>
  );
}
