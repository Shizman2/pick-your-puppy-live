import Logo from "./Logo";
import CountdownTimer from "./CountdownTimer";
import PrivacyNotice from "./PrivacyNotice";
import type { EventRow } from "../../lib/eventTypes";

interface CountdownScreenProps {
  event: EventRow;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  showDateDisplay: string;
  showTimeDisplay: string;
}

/**
 * Public State Two: Active Countdown.
 * Phase 5: headline/messages come from the real database row.
 * Days/hours/minutes/seconds and date/time display are computed
 * client-side in ShowPageClient from the real show_at timestamp.
 */
export default function CountdownScreen({
  event,
  days,
  hours,
  minutes,
  seconds,
  showDateDisplay,
  showTimeDisplay,
}: CountdownScreenProps) {
  return (
    <div className="page-shell">
      <div className="page-inner">
        <Logo />

        <h1 className="headline">{event.countdown_headline}</h1>

        <CountdownTimer days={days} hours={hours} minutes={minutes} seconds={seconds} />

        <div className="show-datetime">
          {showDateDisplay} • {showTimeDisplay}
        </div>

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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <div className="helper-row__text">{event.countdown_helper_message}</div>
        </div>

        <PrivacyNotice message={event.private_waiting_message} />
      </div>
    </div>
  );
}
