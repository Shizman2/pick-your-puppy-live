import Logo from "./Logo";
import PrivacyNotice from "./PrivacyNotice";
import type { EventRow } from "../../lib/eventTypes";

interface ScheduledScreenProps {
  event: EventRow;
}

/**
 * Public State One: Scheduled.
 * Phase 5: content now comes from the real database row, not fakeEvent.
 */
export default function ScheduledScreen({ event }: ScheduledScreenProps) {
  return (
    <div className="page-shell">
      <div className="page-inner">
        <Logo />

        <h1 className="headline">{event.scheduled_headline}</h1>

        <div className="show-datetime">{event.scheduled_message}</div>

        <div className="featured-image-frame">
          {event.featured_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.featured_image_url} alt="Featured event" />
          ) : (
            <div className="featured-image-placeholder">Featured Image</div>
          )}
        </div>

        <div className="helper-row">
          <div className="helper-row__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M3 9h18" />
            </svg>
          </div>
          <div className="helper-row__text">{event.scheduled_helper_message}</div>
        </div>

        <PrivacyNotice message={event.private_waiting_message} />
      </div>
    </div>
  );
}
