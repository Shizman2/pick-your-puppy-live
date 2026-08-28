import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import GoalWidget from "../../../components/admin/dashboard/GoalWidget";
import PuppyStatusDonut from "../../../components/admin/dashboard/PuppyStatusDonut";
import { getDashboardData, getPuppyStatusBreakdown, getTodayActivities } from "../../../lib/dashboard";
import type { DashboardData, PuppyStatusBreakdown, TodayActivityItem } from "../../../lib/dashboard";
import { getDashboardSalesSummary, getSalesListData } from "../../../lib/sales";
import type { DashboardSalesSummary, SaleListItem } from "../../../lib/sales";
import { getActiveGoal, getGoalProgress } from "../../../lib/goals";
import type { GoalProgress } from "../../../lib/goalTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import { formatRelativeTime } from "../../../lib/formatRelative";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { SALE_PROGRESS_LABEL } from "../../../lib/saleTypes";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/dashboard/dashboard.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data: DashboardData | null = null;
  let salesSummary: DashboardSalesSummary | null = null;
  let activeSales: SaleListItem[] = [];
  let puppyStatus: PuppyStatusBreakdown | null = null;
  let todayActivities: TodayActivityItem[] = [];
  let goalProgress: GoalProgress | null = null;
  let loadError: string | null = null;

  try {
    data = await getDashboardData();
    salesSummary = await getDashboardSalesSummary();
    activeSales = await getSalesListData();
    puppyStatus = await getPuppyStatusBreakdown();
    todayActivities = await getTodayActivities();
    const goal = await getActiveGoal();
    goalProgress = goal ? await getGoalProgress(goal) : null;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading the dashboard.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();
  const firstName = userEmail ? userEmail.split("@")[0].split(".")[0] : "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const soldCount = puppyStatus?.sold || 0;
  const totalCount = puppyStatus?.total || 0;

  return (
    <AdminSidebar active="dashboard" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        {loadError || !data || !salesSummary || !puppyStatus ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load the dashboard.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <>
            <div className="dash2-greeting">Good morning, {displayName} 👋</div>
            <div className="dash2-subgreeting">Here&apos;s what&apos;s happening with your business today.</div>

            <div className="dash2-grid">
              <div>
                <div className="dash2-stat-row">
                  <div className="dash2-stat-card">
                    <div className="dash2-stat-label">🐾 Puppies Sold</div>
                    <div className="dash2-stat-value">
                      {soldCount} <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>/ {totalCount}</span>
                    </div>
                    <div className="dash2-stat-bar">
                      <div
                        className="dash2-stat-bar-fill"
                        style={{ width: `${totalCount > 0 ? (soldCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="dash2-stat-card">
                    <div className="dash2-stat-label">📈 Sold This Week</div>
                    <div className="dash2-stat-value">{goalProgress?.soldThisWeek ?? 0}</div>
                    <div className="dash2-stat-sub">
                      {goalProgress ? `Goal: ${goalProgress.weeklyPaceNeeded}/wk` : "No active goal"}
                    </div>
                  </div>
                  <div className="dash2-stat-card">
                    <div className="dash2-stat-label">🛍 Available</div>
                    <div className="dash2-stat-value">{puppyStatus.available}</div>
                    <div className="dash2-stat-sub">Ready to sell</div>
                  </div>
                  <div className="dash2-stat-card">
                    <div className="dash2-stat-label">💲 Revenue Today</div>
                    <div className="dash2-stat-value">{formatPriceFromCents(salesSummary.todayRevenueCents)}</div>
                    <div className="dash2-stat-sub">Deposits + payments</div>
                  </div>
                </div>

                <div className="dash2-section">
                  <div className="dash2-section-header">
                    <div className="dash2-section-title">Active Puppy Sales</div>
                    <Link href="/admin/sales" className="dash2-section-link">
                      View All Sales →
                    </Link>
                  </div>
                  {activeSales.length === 0 ? (
                    <p className="admin-hint">No active sales right now.</p>
                  ) : (
                    <div className="dash2-table-scroll">
                      <table className="dash2-sales-table">
                        <thead>
                          <tr>
                            <th>Puppy</th>
                            <th>Breed</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Price</th>
                            <th>Paid</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSales.slice(0, 6).map((item) => (
                            <tr key={item.sale.id}>
                              <td>
                                <Link href={`/admin/sales/${item.sale.id}`}>{item.puppyName}</Link>
                              </td>
                              <td>{item.breed}</td>
                              <td>{item.contactName}</td>
                              <td>
                                <span className={`dash2-progress-pill ${item.progress}`}>
                                  {SALE_PROGRESS_LABEL[item.progress]}
                                </span>
                              </td>
                              <td>{formatPriceFromCents(item.sale.sale_price_cents)}</td>
                              <td>{formatPriceFromCents(item.totalPaidCents)}</td>
                              <td>{formatPriceFromCents(Math.max(0, item.sale.sale_price_cents - item.totalPaidCents))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="dash2-grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", marginBottom: 0 }}>
                  <div className="dash2-section">
                    <div className="dash2-section-header">
                      <div className="dash2-section-title">Puppy Status Overview</div>
                    </div>
                    <PuppyStatusDonut data={puppyStatus} />
                  </div>

                  <div className="dash2-section">
                    <div className="dash2-section-header">
                      <div className="dash2-section-title">Revenue Overview</div>
                    </div>
                    <div className="dash2-revenue-line">
                      <span className="admin-hint">Collected today</span>
                    </div>
                    <div className="dash2-revenue-amount">{formatPriceFromCents(salesSummary.todayRevenueCents)}</div>
                    <div className="admin-hint" style={{ marginTop: 10 }}>
                      Deposits today: {formatPriceFromCents(salesSummary.todayDepositsCents)}
                      <br />
                      Other payments today: {formatPriceFromCents(salesSummary.todayPaymentsCents)}
                    </div>
                  </div>
                </div>

                <div className="dash2-section">
                  <div className="dash2-section-title" style={{ marginBottom: 12 }}>
                    Quick Actions
                  </div>
                  <div className="dash2-quick-actions">
                    <Link href="/admin/puppies/new" className="dash2-quick-action">
                      + Add Puppy
                    </Link>
                    <Link href="/admin/contacts/new" className="dash2-quick-action">
                      + Add Customer
                    </Link>
                    <Link href="/admin/sales" className="dash2-quick-action">
                      $ Record Payment
                    </Link>
                    <Link href="/admin/tasks" className="dash2-quick-action">
                      ✓ Add Today&apos;s Action
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 16 }}>
                  <GoalWidget progress={goalProgress} />
                </div>

                <div className="dash2-section">
                  <div className="dash2-section-header">
                    <div className="dash2-section-title">Today&apos;s Actions</div>
                    <Link href="/admin/tasks" className="dash2-section-link">
                      View All →
                    </Link>
                  </div>
                  {todayActivities.length === 0 ? (
                    <p className="admin-hint">Nothing due today.</p>
                  ) : (
                    todayActivities.map((a) => (
                      <div key={a.id} className="dash2-todo-item">
                        <span className="dash2-todo-checkbox" />
                        <span>
                          {a.title}
                          <br />
                          <Link href={`/admin/contacts/${a.contactId}`} style={{ color: "#8B6BFF", fontWeight: 600 }}>
                            {a.contactName}
                          </Link>
                        </span>
                        {a.dueTime && <span className="dash2-todo-time">{a.dueTime.slice(0, 5)}</span>}
                      </div>
                    ))
                  )}
                </div>

                <div className="dash2-section">
                  <div className="dash2-section-header">
                    <div className="dash2-section-title">Recent Activity</div>
                  </div>
                  {data.recentActivity.length === 0 ? (
                    <p className="admin-hint">Nothing yet.</p>
                  ) : (
                    data.recentActivity.slice(0, 6).map((item) => (
                      <div key={item.id} className="dash2-activity-item">
                        <span className="dash2-activity-icon">•</span>
                        <div>
                          <Link href={`/admin/contacts/${item.contactId}`} style={{ color: "#111827", fontWeight: 700, textDecoration: "none" }}>
                            {item.contactName}
                          </Link>{" "}
                          —{" "}
                          {item.relatedHref ? (
                            <Link href={item.relatedHref} style={{ color: "#374151", textDecoration: "underline" }}>
                              {item.description}
                            </Link>
                          ) : (
                            <span>{item.description}</span>
                          )}
                          <div className="dash2-activity-time">{formatRelativeTime(item.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminSidebar>
  );
}
