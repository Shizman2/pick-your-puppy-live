import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import MediaManagerClient from "../../../components/admin/media/MediaManagerClient";
import { getAllMediaAssets, getAllPlacements, getAssetUsageCounts } from "../../../lib/mediaAdmin";
import { getPuppiesListData } from "../../../lib/puppies";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/media/media.css";

export const dynamic = "force-dynamic";

export default async function MediaManagerPage() {
  let assets: Awaited<ReturnType<typeof getAllMediaAssets>> = [];
  let placements: Awaited<ReturnType<typeof getAllPlacements>> = [];
  let usageCounts: Awaited<ReturnType<typeof getAssetUsageCounts>> = {};
  let puppies: Awaited<ReturnType<typeof getPuppiesListData>> = [];
  let loadError: string | null = null;

  try {
    [assets, placements, usageCounts, puppies] = await Promise.all([
      getAllMediaAssets(),
      getAllPlacements(),
      getAssetUsageCounts(),
      getPuppiesListData(),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading media manager data.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="media_manager" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Banner &amp; Media Manager</h1>
            <p className="contacts-subtitle">Upload once, place anywhere on the website.</p>
          </div>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load media manager data.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
            <p style={{ marginTop: 8, fontSize: 13, color: "#6b7076" }}>
              If this is the first time opening this page, make sure the Phase 1 migration has been run in Supabase
              and the <code>media-assets</code> storage bucket has been created.
            </p>
          </div>
        ) : (
          <MediaManagerClient
            initialAssets={assets}
            initialPlacements={placements}
            usageCounts={usageCounts}
            puppies={puppies.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))}
          />
        )}
      </div>
    </AdminSidebar>
  );
}
