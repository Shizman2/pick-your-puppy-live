import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import MetricCard from "../../../components/admin/analytics/MetricCard";
import TrafficOverviewChart from "../../../components/admin/analytics/TrafficOverviewChart";
import MostViewedPuppiesCard from "../../../components/admin/analytics/MostViewedPuppiesCard";
import TrafficSourcesDonut from "../../../components/admin/analytics/TrafficSourcesDonut";
import CtaActivityCard from "../../../components/admin/analytics/CtaActivityCard";
import OnlineNowWidget from "../../../components/admin/analytics/OnlineNowWidget";
import AnalyticsDateFilter from "../../../components/admin/analytics/AnalyticsDateFilter";
import AnalyticsDeviceExclusion from "../../../components/admin/analytics/AnalyticsDeviceExclusion";
import { VisitorsIcon, PageViewsIcon, PuppyViewsIcon, CtaClicksIcon, OnlineNowIcon } from "../../../components/admin/analytics/icons";
import {
  getTopMetrics,
  getTrafficOverview,
  getMostViewedPuppies,
  getTrafficSources,
  getCtaActivity,
  getOnlineNow,
  type DateRangeKey,
} from "../../../lib/analytics/queries";
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

export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = parseRange(searchParams?.range);

  const [userEmail, unreadMessageCount, metrics, trafficOverview, mostViewedPuppies, trafficSources, ctaActivity, onlineNow] =
    await Promise.all([
      getAdminUserEmail(),
      getUnreadMessageCount(),
      getTopMetrics(range),
      getTrafficOverview(range),
      getMostViewedPuppies(range),
      getTrafficSources(range),
      getCtaActivity(range),
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
            icon={<VisitorsIcon />}
            colorKey="blue"
            value={metrics.visitors.value}
            label="Visitors"
            changePercent={metrics.visitors.percentChange}
            compareLabel={compareLabel}
          />
          <MetricCard
            icon={<PageViewsIcon />}
            colorKey="green"
            value={metrics.pageViews.value}
            label="Page Views"
            changePercent={metrics.pageViews.percentChange}
            compareLabel={compareLabel}
          />
          <MetricCard
            icon={<PuppyViewsIcon />}
            colorKey="amber"
            value={metrics.puppyViews.value}
            label="Puppy Views"
            changePercent={metrics.puppyViews.percentChange}
            compareLabel={compareLabel}
          />
          <MetricCard
            icon={<CtaClicksIcon />}
            colorKey="purple"
            value={metrics.ctaClicks.value}
            label="CTA Clicks"
            changePercent={metrics.ctaClicks.percentChange}
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

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title">Traffic Overview</div>
          </div>
          <TrafficOverviewChart points={trafficOverview} />
        </div>

        <div className="analytics-row-uneven">
          <MostViewedPuppiesCard puppies={mostViewedPuppies} />
          <TrafficSourcesDonut total={trafficSources.total} breakdown={trafficSources.breakdown} />
        </div>

        <div className="analytics-row-even">
          <CtaActivityCard items={ctaActivity} />
          <OnlineNowWidget initial={onlineNow} />
        </div>

        <AnalyticsDeviceExclusion />
      </div>
    </AdminSidebar>
  );
}
