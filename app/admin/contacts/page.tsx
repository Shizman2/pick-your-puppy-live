import Link from "next/link";
import Logo from "../../../components/public/Logo";
import SignOutButton from "../../../components/admin/SignOutButton";
import ContactsListClient from "../../../components/admin/contacts/ContactsListClient";
import { getContactsListData } from "../../../lib/contactsList";
import "../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

/**
 * Checkpoint 3, part 1: Contacts list only. The Contact Profile page
 * (clicking into a single contact) is intentionally not built yet -
 * that's part 2, reviewed separately per the approved plan.
 */
export default async function ContactsPage() {
  const contacts = await getContactsListData();

  return (
    <div className="contacts-shell">
      <div className="contacts-topbar">
        <Link href="/admin" className="contacts-back-link">
          ← Dashboard
        </Link>
        <Logo />
        <SignOutButton />
      </div>

      <ContactsListClient contacts={contacts} />
    </div>
  );
}
