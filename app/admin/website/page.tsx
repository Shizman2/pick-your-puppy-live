import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import WebsiteEditorClient from "../../../components/admin/website/WebsiteEditorClient";
import { getWebsiteOverviewData } from "../../../lib/content";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/website/website.css";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  let overview: Awaited<ReturnType<typeof getWebsiteOverviewData>> | null = null;
  let loadError: string | null = null;

  try {
    overview = await getWebsiteOverviewData();
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
            <p className="contacts-subtitle">Manage the content that appears on your website.</p>
          </div>
          <div className="website-header-actions">
            {/* TODO: wire to the real IHeartPuppy.com live URL once confirmed */}
            <span className="admin-hint">Live site link not wired yet - confirm your real URL</span>
          </div>
        </div>

        {loadError || !overview ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load website content.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <WebsiteEditorClient
            blocksByPage={overview.blocksByPage}
            faqItems={overview.faqItems}
            recentChanges={overview.recentChanges}
            mediaItems={overview.mediaItems}
          />
        )}
      </div>
    </AdminSidebar>
  );
}
