import Link from "next/link";
import Logo from "../../../components/public/Logo";
import SignOutButton from "../../../components/admin/SignOutButton";
import MessageCenterClient from "../../../components/admin/messages/MessageCenterClient";
import { getMessageCenterData } from "../../../lib/messageCenter";
import type { MessageCenterData } from "../../../lib/messageCenter";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/messages/messageCenter.css";

export const dynamic = "force-dynamic";

/**
 * Puppy OS Message Center - read-only for this checkpoint. Replaces
 * the old, disconnected /admin/messages page (the simple
 * contact_messages inbox) entirely - there is only one Messages page
 * now. The old contact_messages table itself is left untouched as a
 * backup until the planned migration step; nothing here reads from it
 * anymore.
 *
 * No reply/send/call/text/email actions here - see the approved
 * Checkpoint 4 spec for that, which comes later. This checkpoint is
 * purely "who is this person, what do they want, how did they get
 * here" - visibility before tooling.
 */
export default async function MessagesPage() {
  let data: MessageCenterData = { list: [], detailsByContactId: {} };
  let loadError: string | null = null;

  try {
    data = await getMessageCenterData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading messages.";
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
            <strong>Couldn&apos;t load messages.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        </div>
      ) : (
        <MessageCenterClient list={data.list} detailsByContactId={data.detailsByContactId} />
      )}
    </div>
  );
}
