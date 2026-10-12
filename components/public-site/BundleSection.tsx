import "./bundle-section.css";

// Compact "No Pet Store Runs." strip used on puppy detail pages: truck on
// the left, copy, outlined heart on the right. Same copy as the default note.
function NoPetStoreRunsStrip() {
  return (
    <div className="bundle-strip">
      <svg className="bundle-strip-truck" viewBox="0 0 32 24" width="34" height="26" fill="none" aria-hidden="true">
        <path d="M2 5h17v12H2z" stroke="var(--pp-blue)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M19 9h6l4 4v4h-10z" stroke="var(--pp-blue)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="8" cy="19" r="2.6" fill="#fff" stroke="var(--pp-blue)" strokeWidth="2" />
        <circle cx="24" cy="19" r="2.6" fill="#fff" stroke="var(--pp-blue)" strokeWidth="2" />
      </svg>
      <div className="bundle-strip-text">
        <strong>No Pet Store Runs.</strong>
        <span>We&rsquo;ve already taken care of everything you need!</span>
      </div>
      <svg className="bundle-strip-heart" viewBox="0 0 48 48" width="26" height="26" fill="none" aria-hidden="true">
        <path
          d="M24 40C10 30 4 22 4 14.5 4 8.5 8.8 4 14.5 4c3.4 0 6.6 1.7 8.5 4.4C24.9 5.7 28.1 4 31.5 4 37.2 4 42 8.5 42 14.5 42 22 36 30 24 40z"
          stroke="var(--pp-blue)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function BundleSection({ noteStyle = "default" }: { noteStyle?: "default" | "strip" }) {
  return (
    <section className="bundle-section">
      <div className="bundle-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bundle-full.webp"
          width={900}
          height={720}
          alt="What comes with your puppy: health guarantee, health and shot records, starter bag of Diamond puppy food, brand-new crate, food and water bowls, pee pads, and potty bags"
        />
      </div>

      {noteStyle === "strip" ? (
        <NoPetStoreRunsStrip />
      ) : (
        <div className="bundle-note">
          <div className="bundle-note-icon">
            <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
              <path
                d="M12 16h24l-2 24a3 3 0 01-3 3H17a3 3 0 01-3-3l-2-24z"
                stroke="var(--pp-blue)"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M17 16v-3a7 7 0 0114 0v3"
                stroke="var(--pp-blue)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M24 24c-2.2-2.4-6-1-6 1.6 0 2.6 3.4 4.8 6 7 2.6-2.2 6-4.4 6-7 0-2.6-3.8-4-6-1.6z"
                stroke="var(--pp-blue)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="bundle-note-accent">
            <svg viewBox="0 0 16 6" width="16" height="6" fill="none">
              <path d="M1 3c2-2 4-2 6 0s4 2 6 0" stroke="var(--pp-blue)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 16 6" width="16" height="6" fill="none">
              <path d="M1 3c2-2 4-2 6 0s4 2 6 0" stroke="var(--pp-blue)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          <div className="bundle-note-text">
            <strong>No Pet Store Runs.</strong>
            <span>We&rsquo;ve already taken care of everything you need!</span>
          </div>

          <div className="bundle-note-accent">
            <svg viewBox="0 0 16 6" width="16" height="6" fill="none">
              <path d="M1 3c2-2 4-2 6 0s4 2 6 0" stroke="var(--pp-blue)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 16 6" width="16" height="6" fill="none">
              <path d="M1 3c2-2 4-2 6 0s4 2 6 0" stroke="var(--pp-blue)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          <div className="bundle-note-heart-wrap">
            <svg className="sparkle" viewBox="0 0 20 20" width="14" height="14" fill="none">
              <path d="M10 2v6M6 4l1.5 4.5M14 4l-1.5 4.5" stroke="var(--pp-blue)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
              <path
                d="M24 40C10 30 4 22 4 14.5 4 8.5 8.8 4 14.5 4c3.4 0 6.6 1.7 8.5 4.4C24.9 5.7 28.1 4 31.5 4 37.2 4 42 8.5 42 14.5 42 22 36 30 24 40z"
                stroke="var(--pp-blue)"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </section>
  );
}
