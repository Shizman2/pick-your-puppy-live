export default function PartnerHowYouEarn() {
  return (
    <section className="partner-earn">
      <div className="partner-earn-text">
        <h2 className="partner-earn-title">How You Earn</h2>
        <p className="partner-earn-copy">
          You share your unique link with your audience. When a puppy is purchased through your link you earn a
          commission.
        </p>
      </div>
      <div className="partner-earn-decal">
        <svg className="partner-earn-paw" viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <ellipse cx="6.5" cy="9.5" rx="2.1" ry="2.6" transform="rotate(-15 6.5 9.5)" />
          <ellipse cx="10.8" cy="6.2" rx="2.1" ry="2.7" />
          <ellipse cx="15.2" cy="6.2" rx="2.1" ry="2.7" />
          <ellipse cx="19.3" cy="9.5" rx="2.1" ry="2.6" transform="rotate(15 19.3 9.5)" />
          <path d="M12.9 11.2c-3.6 0-6.4 2.7-6.4 5.6 0 2.1 1.7 3.4 3.6 3.4 1.1 0 1.9-.4 2.8-.4s1.7.4 2.8.4c1.9 0 3.6-1.3 3.6-3.4 0-2.9-2.8-5.6-6.4-5.6z" />
        </svg>
        {/* Reference note is a rotated handwritten scrawl in the same
            navy as the heading (not red like the paw) with a small red
            heart tucked under the last line - see .partner-earn-note. */}
        <div className="partner-earn-note">
          {/* Hardcoded breaks, not natural wrap - relying on the
              container width to produce exactly 3 lines drifted to 4-5
              lines across viewport/font tweaks, so the line breaks are
              pinned here instead. */}
          <span className="partner-earn-note-text">
            Same Puppies.
            <br />
            More Happy
            <br />
            Families.
          </span>
          <svg className="partner-earn-heart" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-10-9.1C.6 8.7 2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5 18 5 19.4 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
          </svg>
        </div>
      </div>
    </section>
  );
}
