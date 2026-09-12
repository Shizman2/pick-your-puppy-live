import { redirect } from "next/navigation";
import { requireAffiliateUser } from "../../../lib/authz";
import { getAffiliateById } from "../../../lib/affiliates";
import PartnersShell from "../../../components/partners/PartnersShell";
import MyProfileForm from "../../../components/partners/MyProfileForm";
import "../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

export default async function PartnersProfilePage() {
  const auth = await requireAffiliateUser();
  if (!auth.ok) redirect("/partners/login");

  const affiliate = await getAffiliateById(auth.affiliateId);
  if (!affiliate) redirect("/partners/login");

  return (
    <PartnersShell>
      <h1 className="contacts-title">Profile</h1>
      <MyProfileForm affiliate={affiliate} />
    </PartnersShell>
  );
}
