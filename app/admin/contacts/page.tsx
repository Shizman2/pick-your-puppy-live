import Link from "next/link";
import Logo from "../../../components/public/Logo";
import SignOutButton from "../../../components/admin/SignOutButton";
import ContactsListClient from "../../../components/admin/contacts/ContactsListClient";
import { getContactsListData } from "../../../lib/contactsList";
import type { ContactListItem } from "../../../lib/contactTypes";
import "../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

/**
 * Checkpoint 3, part 1: Contacts list only. The Contact Profile page
 * (clicking into a single contact) is intentionally not built yet -
 * that's part 2, reviewed separately per the approved plan.
 */
export default async function ContactsPage() {
  let contacts: ContactListItem[];
  let loadError: string | null = null;

  try {
    contacts = await getContactsListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading contacts.";
    contacts = [];
  }

  return (
    <div className="contacts-shell">
      <div className="contacts-topbar">
        <Link href="/admin" className="contacts-back-link">
          ← Dashboard
        </Link>
        <Logo />
        <SignOutButton />
      </div>

      {loadError ? (
        <div className="contacts-page">
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load contacts.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
            <p style={{ marginTop: 8 }}>
              If this mentions a missing column (like <code>is_read</code> or{" "}
              <code>is_active</code>), the Supabase migration
              (<code>supabase/003_puppy_os_core_schema.sql</code>) hasn&apos;t been run
              yet against the live database.
            </p>
          </div>
        </div>
      ) : (
        <ContactsListClient contacts={contacts} />
      )}
    </div>
  );
}
