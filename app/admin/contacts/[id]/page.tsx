import Link from "next/link";
import Logo from "../../../../components/public/Logo";
import SignOutButton from "../../../../components/admin/SignOutButton";
import ContactProfileClient from "../../../../components/admin/contacts/ContactProfileClient";
import { getContactProfileData } from "../../../../lib/contactProfile";
import type { ContactProfileData } from "../../../../lib/contactTypes";
import "../../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

/**
 * Checkpoint 3, part 2: Contact Profile. Answers "who is this person,
 * what are they interested in, what's happened, what's next" - it
 * does NOT include the message thread. That's the Message Center
 * (next checkpoint), which will be the one place conversations
 * actually happen, so this page only links out to it rather than
 * building a second inbox UI here.
 */
export default async function ContactProfilePage({ params }: { params: { id: string } }) {
  let profile: ContactProfileData | null = null;
  let loadError: string | null = null;

  try {
    profile = await getContactProfileData(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading contact.";
  }

  return (
    <div className="contacts-shell">
      <div className="contacts-topbar">
        <Link href="/admin/contacts" className="contacts-back-link">
          ← Contacts
        </Link>
        <Logo />
        <SignOutButton />
      </div>

      <div className="contacts-page">
        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this contact.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !profile ? (
          <div className="contacts-empty">
            Contact not found. It may have been deleted, or the link is wrong.
          </div>
        ) : (
          <ContactProfileClient profile={profile} />
        )}
      </div>
    </div>
  );
}
