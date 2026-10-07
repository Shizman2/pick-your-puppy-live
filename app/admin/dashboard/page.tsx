import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import GoalWidget from "../../../components/admin/dashboard/GoalWidget";
import PuppyStatusDonut from "../../../components/admin/dashboard/PuppyStatusDonut";
import DashboardDateFilter from "../../../components/admin/dashboard/DashboardDateFilter";
import MarketingPerformanceCard from "../../../components/admin/dashboard/MarketingPerformanceCard";
import AdSpendCard from "../../../components/admin/analytics/AdSpendCard";
import { getDashboardData, getPuppyStatusBreakdown, getTodayActivities } from "../../../lib/dashboard";
import type { DashboardData, PuppyStatusBreakdown, TodayActivityItem } from "../../../lib/dashboard";
import { getSalesListData } from "../../../lib/sales";
import type { SaleListItem } from "../../../lib/sales";
import { getActiveGoal, getGoalProgress } from "../../../lib/goals";
import type { GoalProgress } from "../../../lib/goalTypes";
import {
  getPeriodFinancials,
  getScorecardMetrics,
  getMarketingPerformance,
  resolveDashboardPeriod,
  type PeriodFinancials,
  type ScorecardMetrics,
  type MarketingPerformance as MarketingPerformanceData,
  type DashboardPeriodKey,
} from "../../../lib/businessScorecard";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadConversationCount } from "../../../lib/unreadCount";
import { getRecentAdSpendEntries } from "../../../lib/adSpend";
import { formatRelativeTime } from "../../../lib/formatRelative";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { SALE_PROGRESS_LABEL } from "../../../lib/saleTypes";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/analytics/analytics.css";
import "../../../components/admin/dashboard/dashboard.css";

export const dynamic = "force-dynamic";

function parsePeriod(value: string | undefined): DashboardPeriodKey {
  if (value === "goal" || value === "7d" || value === "30d" || value === "90d") return value;
  return "goal";
}

/** Gross profit/ad-spend change can run either direction - formatPriceFromCents alone renders a negative as "$-500" instead of "-$500". */
function formatSignedPriceFromCents(cents: number): string {
  return cents < 0 ? `-${formatPriceFromCents(-cents)}` : formatPriceFromCents(cents);
}

function ComparisonLine({ percentChange }: { percentChange: number | null }) {
  if (percentChange === null) {
    return <div className="dash2-stat-compare flat">No prior-period data</div>;
  }
  if (percentChange === 0) {
    return <div className="dash2-stat-compare flat">No change vs previous period</div>;
  }
  const up = percentChange > 0;
  return (
    <div className={`dash2-stat-compare ${up ? "up" : "down"}`}>
      {up ? "↑" : "↓"} {Math.abs(Math.round(percentChange))}% vs previous period
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: { period?: string } }) {
  const periodKey = parsePeriod(searchParams?.period);

  let data: DashboardData | null = null;
  let activeSales: SaleListItem[] = [];
  let puppyStatus: PuppyStatusBreakdown | null = null;
  let todayActivities: TodayActivityItem[] = [];
  let goalProgress: GoalProgress | null = null;
  let scorecard: ScorecardMetrics | null = null;
  let marketing: MarketingPerformanceData | null = null;
  let periodFinancials: PeriodFinancials | null = null;
  let adSpendEntries: Awaited<ReturnType<typeof getRecentAdSpendEntries>> = [];
  let periodLabel = "";
  let loadError: string | null = null;

  try {
    data = await getDashboardData();
    activeSales = await getSalesListData();
    puppyStatus = await getPuppyStatusBreakdown();
    todayActivities = await getTodayActivities();
    const goal = await getActiveGoal();
    goalProgress = goal ? await getGoalProgress(goal) : null;

    const period = resolveDashboardPeriod(periodKey, goal);
    periodLabel = period.label;
    [scorecard, marketing, periodFinancials, adSpendEntries] = await Promise.all([
      getScorecardMetrics(period.start, period.end),
      getMarketingPerformance(period.start, period.end),
      getPeriodFinancials(period.start, period.end),
      getRecentAdSpendEntries(),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading the dashboard.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadConversationCount();
  const firstName = userEmail ? userEmail.split("@")[0].split(".")[0] : "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <AdminSidebar active="dashboard" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        {loadError || !data || !puppyStatus || !scorecard || !marketing || !periodFinancials ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load the dashboard.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div>
                <div className="dash2-greeting">Good morning, {displayName} 👋</div>
                <div className="dash2-subgreeting">Here&apos;s what&apos;s happening with your business today.</div>
              </div>
              <DashboardDateFilter current={periodKey} periodLabel={periodLabel} />
            </div>

            <div className="dash2-stat-row">
              <div className="dash2-stat-card">
                <div className="dash2-stat-label">🐾 Puppies Sold</div>
                <div className="dash2-stat-value">{scorecard.puppiesSold.value}</div>
                <div className="dash2-stat-sub">This period</div>
                <ComparisonLine percentChange={scorecard.puppiesSold.percentChange} />
              </div>
              <div className="dash2-stat-card">
                <div className="dash2-stat-label">💰 Total Revenue</div>
                <div className="dash2-stat-value">{formatPriceFromCents(scorecard.revenueCents.value)}</div>
                <div className="dash2-stat-sub">This period</div>
                <ComparisonLine percentChange={scorecard.revenueCents.percentChange} />
              </div>
              <div className="dash2-stat-card">
                <div className="dash2-stat-label">📊 Gross Profit</div>
                <div className="dash2-stat-value">{formatSignedPriceFromCents(scorecard.grossProfitCents.value)}</div>
                <div className="dash2-stat-sub">This period</div>
                <ComparisonLine percentChange={scorecard.grossProfitCents.percentChange} />
              </div>
              <div className="dash2-stat-card">
                <div className="dash2-stat-label">🧲 Leads</div>
                <div className="dash2-stat-value">{scorecard.leads.value}</div>
                <div className="dash2-stat-sub">This period</div>
                <ComparisonLine percentChange={scorecard.leads.percentChange} />
              </div>
              <div className="dash2-stat-card">
                <div className="dash2-stat-label">📣 Ad Spend</div>
                <div className="dash2-stat-value">{formatPriceFromCents(scorecard.adSpendCents.value)}</div>
                <div className="dash2-stat-sub">This period</div>
                <ComparisonLine percentChange={scorecard.adSpendCents.percentChange} />
              </div>
            </div>

            <MarketingPerformanceCard data={marketing} />

            <AdSpendCard entries={adSpendEntries} />

            <div className="dash2-grid">
              <div>
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
                      <span className="admin-hint">Collected this period</span>
                    </div>
                    <div className="dash2-revenue-amount">{formatPriceFromCents(periodFinancials.revenueCents)}</div>
                    <div className="admin-hint" style={{ marginTop: 10 }}>
                      Deposits: {formatPriceFromCents(periodFinancials.depositsCents)}
                      <br />
                      Other payments: {formatPriceFromCents(periodFinancials.otherPaymentsCents)}
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
