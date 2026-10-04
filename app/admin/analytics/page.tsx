import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import MetricCard from "../../../components/admin/analytics/MetricCard";
import MostViewedPuppiesCard from "../../../components/admin/analytics/MostViewedPuppiesCard";
import AnalyticsDateFilter from "../../../components/admin/analytics/AnalyticsDateFilter";
import AnalyticsDeviceExclusion from "../../../components/admin/analytics/AnalyticsDeviceExclusion";
import { VisitorsIcon, OnlineNowIcon, LandingPageIcon } from "../../../components/admin/analytics/icons";
import { getTopMetrics, getMostViewedPuppies, getOnlineNow, type DateRangeKey } from "../../../lib/analytics/queries";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/analytics/analytics.css";

export const dynamic = "force-dynamic";

const COMPARE_LABEL: Record<DateRangeKey, string> = {
  today: "vs yesterday",
  "7d": "vs previous 7 days",
  "30d": "vs previous 30 days",
};

function parseRange(value: string | undefined): DateRangeKey {
  if (value === "today" || value === "7d" || value === "30d") return value;
  return "7d"; // default, per the approved spec
}

/**
 * Deliberately pared down to exactly 4 things, per the approved
 * simplification: Funnel Page Visitors (real GHL /start visitors - see
 * the Pre-Launch Tracking Fix), Website Visitors (real
 * thepuppyplugs.com visitors), Online Now (real, live
 * analytics_sessions.last_activity_at activity - never estimated, never
 * session-substituted), and Puppy Views ranked by puppy. Every other
 * card previously on this page (Sessions/Page Views/CTA Clicks/Leads/
 * Inquiries/Landing Page Views, Traffic Overview, Traffic Sources, CTA
 * Activity, the live Online Now list, Top Pages, Landing Pages,
 * Campaigns, Funnel, Ad Spend, Device Exclusion) was intentionally
 * removed from this page's UI - none of their underlying query
 * functions or components were deleted, so nothing here is lost if a
 * future task wants any of it back. Ad Spend management still lives on
 * the Business Dashboard (see app/admin/dashboard/page.tsx) - it was
 * never only here. Device Exclusion is the one exception restored at
 * the bottom below - it's a privacy control, not a metric, so it isn't
 * part of the "ONLY 4 things" count.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = parseRange(searchParams?.range);

  const [userEmail, unreadMessageCount, metrics, mostViewedPuppies, onlineNow] = await Promise.all([
    getAdminUserEmail(),
    getUnreadMessageCount(),
    getTopMetrics(range),
    getMostViewedPuppies(range),
    getOnlineNow(),
  ]);

  const compareLabel = COMPARE_LABEL[range];

  return (
    <AdminSidebar active="analytics" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="analytics-page">
        <div className="analytics-header-row">
          <div>
            <div className="analytics-header-title">Website Analytics</div>
            <div className="analytics-header-sub">See how visitors are finding and using your website.</div>
          </div>
          <AnalyticsDateFilter current={range} />
        </div>

        <div className="analytics-metric-row">
          <MetricCard
            icon={<LandingPageIcon />}
            colorKey="blue"
            value={metrics.landingVisitors.value}
            label="Funnel Page Visitors"
            changePercent={metrics.landingVisitors.percentChange}
            compareLabel={compareLabel}
          />
          <MetricCard
            icon={<VisitorsIcon />}
            colorKey="teal"
            value={metrics.visitors.value}
            label="Website Visitors"
            changePercent={metrics.visitors.percentChange}
            compareLabel={compareLabel}
          />
          <MetricCard
            icon={<OnlineNowIcon />}
            colorKey="red"
            value={onlineNow.count}
            label="Online Now"
            changePercent={null}
            compareLabel="Active in last 2 minutes"
          />
        </div>

        <MostViewedPuppiesCard puppies={mostViewedPuppies} />

        <AnalyticsDeviceExclusion />
      </div>
    </AdminSidebar>
  );
}
