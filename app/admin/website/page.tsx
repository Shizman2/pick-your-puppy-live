import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import WebsiteEditorClient from "../../../components/admin/website/WebsiteEditorClient";
import { getContentBlocksForPage, getFaqItems } from "../../../lib/content";
import type { ContentBlockRow, ContentPage } from "../../../lib/contentTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/website/website.css";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  let blocksByPage: Record<ContentPage, ContentBlockRow[]> = {
    homepage: [],
    about: [],
    contact: [],
    faq: [],
  };
  let faqItems: Awaited<ReturnType<typeof getFaqItems>> = [];
  let loadError: string | null = null;

  try {
    const [homepage, about, contact, faq] = await Promise.all([
      getContentBlocksForPage("homepage"),
      getContentBlocksForPage("about"),
      getContentBlocksForPage("contact"),
      getFaqItems(),
    ]);
    blocksByPage = { homepage, about, contact, faq: [] };
    faqItems = faq;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading website content.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="website" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Website</h1>
            <p className="contacts-subtitle">Edit the text, images, and FAQ on IHeartPuppy.com</p>
          </div>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load website content.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <WebsiteEditorClient blocksByPage={blocksByPage} faqItems={faqItems} />
        )}
      </div>
    </AdminSidebar>
  );
}
