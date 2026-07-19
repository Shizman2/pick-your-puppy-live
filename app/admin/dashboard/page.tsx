import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import { getDashboardData } from "../../../lib/dashboard";
import type { DashboardData } from "../../../lib/dashboard";
import { getDashboardSalesSummary } from "../../../lib/sales";
import type { DashboardSalesSummary } from "../../../lib/sales";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import { formatRelativeTime } from "../../../lib/formatRelative";
import IconBadge, { ICONS } from "../../../components/admin/dashboard/IconBadge";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { SALE_PROGRESS_LABEL } from "../../../lib/saleTypes";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/dashboard/dashboard.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data: DashboardData | null = null;
  let salesSummary: DashboardSalesSummary | null = null;
  let loadError: string | null = null;

  try {
    data = await getDashboardData();
    salesSummary = await getDashboardSalesSummary();
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
                <IconBadge color="green" path="M12 2v20M17 7a4 4 0 00-4-3H10a3 3 0 000 6h4a3 3 0 010 6h-3a4 4 0 01-4-3" />
                <div className="dashboard-stat-body">
                  <div className="dashboard-stat-value">
                    {formatPriceFromCents(salesSummary?.todayRevenueCents || 0)}
                  </div>
                  <div className="dashboard-stat-label">Today&apos;s revenue</div>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <IconBadge color="purple" path={ICONS.contacts} />
                <div className="dashboard-stat-body">
                  <div className="dashboard-stat-value">{data.newContactsThisWeek}</div>
                  <div className="dashboard-stat-label">New contacts (7 days)</div>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <IconBadge color="blue" path={ICONS.message} />
                <div className="dashboard-stat-body">
                  <div className="dashboard-stat-value">{data.unreadMessages}</div>
                  <div className="dashboard-stat-label">Unread messages</div>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <IconBadge color="orange" path={ICONS.checklist} />
                <div className="dashboard-stat-body">
                  <div className="dashboard-stat-value">{data.activitiesDueTodayOrOverdue}</div>
                  <div className="dashboard-stat-label">Activities due/overdue</div>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <IconBadge color="green" path={ICONS.heart} />
                <div className="dashboard-stat-body">
                  <div className="dashboard-stat-value">{data.highInterestCount}</div>
                  <div className="dashboard-stat-label">High interest contacts</div>
                </div>
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
                      <span className="dashboard-attention-left">
                        <IconBadge color="red" path={ICONS.phone} size="small" />
                        <span>
                          <Link href={`/admin/contacts/${a.contactId}`}>{a.contactName}</Link> — {a.title}
                        </span>
                      </span>
                      <span className="dashboard-attention-tag">Overdue activity</span>
                    </div>
                  ))}
                  {data.needsAttention.staleUnread.map((m) => (
                    <div key={m.contactId} className="dashboard-attention-item">
                      <span className="dashboard-attention-left">
                        <IconBadge color="blue" path={ICONS.message} size="small" />
                        <span>
                          <Link href={`/admin/messages#${m.contactId}`}>{m.contactName}</Link> — unread since{" "}
                          {formatRelativeTime(m.lastMessageAt)}
                        </span>
                      </span>
                      <span className="dashboard-attention-tag">Unread</span>
                    </div>
                  ))}
                  {data.needsAttention.staleHighInterest.map((c) => (
                    <div key={c.contactId} className="dashboard-attention-item">
                      <span className="dashboard-attention-left">
                        <IconBadge color="orange" path={ICONS.heart} size="small" />
                        <span>
                          <Link href={`/admin/contacts/${c.contactId}`}>{c.contactName}</Link> — high interest, no
                          recent activity
                        </span>
                      </span>
                      <span className="dashboard-attention-tag">Needs follow-up</span>
                    </div>
                  ))}
                  {data.needsAttention.possibleDuplicates.map((c) => (
                    <div key={c.contactId} className="dashboard-attention-item">
                      <span className="dashboard-attention-left">
                        <IconBadge color="purple" path={ICONS.warning} size="small" />
                        <span>
                          <Link href={`/admin/contacts/${c.contactId}`}>{c.contactName}</Link>
                        </span>
                      </span>
                      <span className="dashboard-attention-tag">Possible duplicate</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-title">Recent Sales</div>
              {!salesSummary || salesSummary.recentSales.length === 0 ? (
                <div className="contacts-empty">No payments logged yet.</div>
              ) : (
                <div className="profile-card">
                  {salesSummary.recentSales.map((s, i) => (
                    <div key={`${s.saleId}-${i}`} className="dashboard-feed-item">
                      <span>
                        <Link href={`/admin/sales/${s.saleId}`}>{s.puppyName}</Link> — {s.contactName} —{" "}
                        {formatPriceFromCents(s.amountCents)}{" "}
                        <span className="dashboard-attention-tag" style={{ marginLeft: 6 }}>
                          {SALE_PROGRESS_LABEL[s.progress]}
                        </span>
                      </span>
                      <span className="dashboard-feed-time">{formatRelativeTime(s.date)}</span>
                    </div>
                  ))}
                </div>
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
