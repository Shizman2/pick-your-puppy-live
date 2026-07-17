import Logo from "./Logo";
import PrivacyNotice from "./PrivacyNotice";
import type { EventRow } from "../../lib/eventTypes";

const DASH_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

interface LiveScreenProps {
  event: EventRow;
  liveShowLink: string | null;
}

/**
 * Public State Three: Live.
 * liveShowLink is only ever populated by the server-verified
 * /api/event-status response - never from anything the client held
 * before the server confirmed the show had started.
 */
export default function LiveScreen({ event, liveShowLink }: LiveScreenProps) {
  return (
    <div className="page-shell">
      <div className="page-inner">
        <Logo />

        <div className="live-indicator-wrap">
          {DASH_ANGLES.map((angle) => (
            <span
              key={angle}
              className="live-indicator-dash"
              style={{
                left: "50%",
                top: "50%",
                transform: `rotate(${angle}deg) translate(0, -78px)`,
                transformOrigin: "0 0",
              }}
            />
          ))}
          <div className="live-indicator-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
              <path d="M8.5 8.5a5 5 0 0 0 0 7" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M5.5 5.5a9 9 0 0 0 0 13" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          </div>
        </div>

        <h1 className="live-headline">{event.live_headline}</h1>
        <p className="live-message">{event.live_message}</p>

        {liveShowLink ? (
          <a href={liveShowLink} className="live-button" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            ENTER THE LIVE SHOW
          </a>
        ) : (
          <button type="button" className="live-button" disabled>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            ENTER THE LIVE SHOW
          </button>
        )}

        <div className="live-divider" />

        <PrivacyNotice message={event.private_live_message} />
      </div>
    </div>
  );
}
