import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import { getDashboardData } from "../../../lib/dashboard";
import type { DashboardData } from "../../../lib/dashboard";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import { formatRelativeTime } from "../../../lib/formatRelative";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/dashboard/dashboard.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data: DashboardData | null = null;
  let loadError: string | null = null;

  try {
    data = await getDashboardData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading the dashboard.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  const attentionCount =
    (data?.needsAttention.overdueActivities.length || 0) +
    (data?.needsAttention.staleUnread.length || 0) +
    (data?.needsAttention.staleHighInterest.length || 0) +
    (data?.needsAttention.possibleDuplicates.length || 0);

  return (
    <AdminSidebar active="dashboard" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Dashboard</h1>
            <p className="contacts-subtitle">Here&apos;s what&apos;s happening with your business today.</p>
          </div>
        </div>

        {loadError || !data ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load the dashboard.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <>
            <div className="dashboard-stat-grid">
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-value">{data.newContactsThisWeek}</div>
                <div className="dashboard-stat-label">New contacts (7 days)</div>
              </div>
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-value">{data.unreadMessages}</div>
                <div className="dashboard-stat-label">Unread messages</div>
              </div>
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-value">{data.activitiesDueTodayOrOverdue}</div>
                <div className="dashboard-stat-label">Activities due/overdue</div>
              </div>
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-value">{data.highInterestCount}</div>
                <div className="dashboard-stat-label">High interest contacts</div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-title">Pipeline</div>
              <div className="dashboard-pipeline">
                {data.pipeline.map((stage) => (
                  <div key={stage.status} className="dashboard-pipeline-stage">
                    <div className="dashboard-pipeline-count">{stage.count}</div>
                    <div className="dashboard-pipeline-label">{stage.status.replace("_", " ")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-title">
                Needs Attention {attentionCount > 0 && `(${attentionCount})`}
              </div>

              {attentionCount === 0 ? (
                <div className="contacts-empty">Nothing needs attention right now.</div>
              ) : (
                <>
                  {data.needsAttention.overdueActivities.map((a) => (
                    <div key={a.id} className="dashboard-attention-item">
                      <span>
                        <Link href={`/admin/contacts/${a.contactId}`}>{a.contactName}</Link> — {a.title}
                      </span>
                      <span className="dashboard-attention-tag">Overdue activity</span>
                    </div>
                  ))}
                  {data.needsAttention.staleUnread.map((m) => (
                    <div key={m.contactId} className="dashboard-attention-item">
                      <span>
                        <Link href={`/admin/messages#${m.contactId}`}>{m.contactName}</Link> — unread since{" "}
                        {formatRelativeTime(m.lastMessageAt)}
                      </span>
                      <span className="dashboard-attention-tag">Unread</span>
                    </div>
                  ))}
                  {data.needsAttention.staleHighInterest.map((c) => (
                    <div key={c.contactId} className="dashboard-attention-item">
                      <span>
                        <Link href={`/admin/contacts/${c.contactId}`}>{c.contactName}</Link> — high interest, no
                        recent activity
                      </span>
                      <span className="dashboard-attention-tag">Needs follow-up</span>
                    </div>
                  ))}
                  {data.needsAttention.possibleDuplicates.map((c) => (
                    <div key={c.contactId} className="dashboard-attention-item">
                      <span>
                        <Link href={`/admin/contacts/${c.contactId}`}>{c.contactName}</Link>
                      </span>
                      <span className="dashboard-attention-tag">Possible duplicate</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-title">Recent Activity</div>
              {data.recentActivity.length === 0 ? (
                <div className="contacts-empty">Nothing yet.</div>
              ) : (
                <div className="profile-card">
                  {data.recentActivity.map((item) => (
                    <div key={item.id} className="dashboard-feed-item">
                      <span>
                        <Link href={`/admin/contacts/${item.contactId}`}>{item.contactName}</Link> — {item.description}
                      </span>
                      <span className="dashboard-feed-time">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminSidebar>
  );
}
