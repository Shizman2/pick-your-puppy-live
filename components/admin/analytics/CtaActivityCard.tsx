import type { CtaActivityItem } from "../../../lib/analytics/queries";
import { EyeIcon, PhoneIcon, ChatIcon, DocumentIcon } from "./icons";

const CTA_LABEL: Record<string, string> = {
  see_available_puppies: "See Available Puppies",
  call_now: "Call Now",
  im_interested: "I'm Interested",
  puppy_finder: "Puppy Finder",
};

const CTA_ICON: Record<string, React.ReactNode> = {
  see_available_puppies: <EyeIcon />,
  call_now: <PhoneIcon />,
  im_interested: <ChatIcon />,
  puppy_finder: <DocumentIcon />,
};

export default function CtaActivityCard({ items }: { items: CtaActivityItem[] }) {
  const maxCount = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">CTA Activity</div>
      </div>
      <div className="analytics-cta-list">
        {items.map((item) => (
          <div key={item.ctaKey} className="analytics-cta-row">
            <div className="analytics-cta-top">
              <span className="analytics-cta-icon">{CTA_ICON[item.ctaKey]}</span>
              <span className="analytics-cta-label">{CTA_LABEL[item.ctaKey]}</span>
              <span className="analytics-cta-count">{item.count}</span>
            </div>
            <div className="analytics-bar-track">
              <div className="analytics-bar-fill" style={{ width: `${(item.count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
