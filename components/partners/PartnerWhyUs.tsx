function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5" strokeLinecap="round" />
      <path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07L12.5 19.5" strokeLinecap="round" />
    </svg>
  );
}
function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <ellipse cx="6.5" cy="9.5" rx="2.1" ry="2.6" transform="rotate(-15 6.5 9.5)" />
      <ellipse cx="10.8" cy="6.2" rx="2.1" ry="2.7" />
      <ellipse cx="15.2" cy="6.2" rx="2.1" ry="2.7" />
      <ellipse cx="19.3" cy="9.5" rx="2.1" ry="2.6" transform="rotate(15 19.3 9.5)" />
      <path d="M12.9 11.2c-3.6 0-6.4 2.7-6.4 5.6 0 2.1 1.7 3.4 3.6 3.4 1.1 0 1.9-.4 2.8-.4s1.7.4 2.8.4c1.9 0 3.6-1.3 3.6-3.4 0-2.9-2.8-5.6-6.4-5.6z" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5L4 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" />
    </svg>
  );
}
function CoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v10c0 1.66 2.69 3 6 3s6-1.34 6-3V7" strokeLinecap="round" />
      <path d="M15 10.5c2.87.3 5 1.5 5 2.9v6.1c0 1.66-2.69 3-6 3-1.53 0-2.92-.29-4-.76" strokeLinecap="round" />
    </svg>
  );
}

// First 3 sit on the top row (2-of-6 columns each = 3 across), last 2
// on the bottom row (3-of-6 columns each = 2 across) - see the
// .partner-whyus-card--half comment in partner-landing.css. The top 3
// pin their supporting copy to explicit lines (rather than the desc
// string) so the wrap matches the reference exactly regardless of
// container width - natural wrap on this page has drifted before.
const FEATURES = [
  {
    title: "Unique Referral Links",
    desc: "Your own custom tracking links.",
    lines: ["Your own custom", "tracking links."],
    icon: <LinkIcon />,
  },
  {
    title: "Promote Specific Puppies",
    desc: "Share individual puppies or our Puppy Finder.",
    lines: ["Share individual", "puppies or our", "Puppy Finder."],
    icon: <PawIcon />,
  },
  {
    title: "Ready-to-Share Creatives",
    desc: "Get photos, videos and content that converts.",
    lines: ["Get photos, videos", "and content that", "converts."],
    icon: <ImageIcon />,
  },
  { title: "Track Clicks & Sales", desc: "See your performance in real time.", icon: <ChartIcon />, half: true },
  { title: "Earn Commissions", desc: "Get paid on completed puppy sales after the approval period.", icon: <CoinsIcon />, half: true },
];

export default function PartnerWhyUs() {
  return (
    <section className="partner-whyus">
      <h2 className="partner-section-title">Why Partner With Us</h2>
      <p className="partner-section-sub">Everything you need to turn your love for puppies into real income.</p>

      <div className="partner-whyus-grid">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`partner-whyus-card${f.half ? " partner-whyus-card--half" : " partner-whyus-card--top"}`}
          >
            <div className="partner-whyus-icon">{f.icon}</div>
            <div>
              <div className="partner-whyus-title">{f.title}</div>
              <div className="partner-whyus-desc">
                {f.lines
                  ? f.lines.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < f.lines.length - 1 ? <br /> : null}
                      </span>
                    ))
                  : f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
