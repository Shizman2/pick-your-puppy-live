import "./how-it-works.css";

export const metadata = {
  title: "How It Works – ThePuppyPlugs.com",
};

function ClipboardIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M9 8h6M9 12h6M9 16h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 3l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="10" cy="10" r="6" stroke={color} strokeWidth="1.8" />
      <path d="M15 15l5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.8" />
      <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" stroke={color} strokeWidth="1.8" />
      <path d="M15 20c0-2.5 1.7-4.7 3.8-5.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShieldCheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M12 3l7 3v6c0 5-3.5 8.5-7 9.5C8.5 20.5 5 17 5 12V6l7-3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 12.2l2.3 2.3L15.7 9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="1" y="8" width="14" height="9" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M15 10h4l3 4v3h-7v-7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.6" />
      <circle cx="18" cy="18.5" r="2" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function HouseIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M3 11l9-8 9 8M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PawIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={color}>
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="6" cy="9.5" r="2.1" />
      <circle cx="10.7" cy="6" r="2.1" />
      <circle cx="15.3" cy="6" r="2.1" />
      <circle cx="18.5" cy="10" r="2.1" />
    </svg>
  );
}

type Step = { title: string; desc: string; icon: (color: string) => React.ReactNode };

const AVAILABLE_STEPS: Step[] = [
  { title: "Browse", desc: "See available puppies.", icon: (c) => <SearchIcon color={c} /> },
  { title: "Choose", desc: "Pick your perfect puppy.", icon: (c) => <HeartIcon color={c} /> },
  { title: "Reserve", desc: "Reserve to hold your puppy.", icon: (c) => <ShieldCheckIcon color={c} /> },
  { title: "Pickup or Delivery", desc: "Pick up locally or arrange delivery.", icon: (c) => <HouseIcon color={c} /> },
];

const FINDER_STEPS: Step[] = [
  { title: "Request", desc: "Tell us what you're looking for.", icon: (c) => <ClipboardIcon color={c} /> },
  { title: "We Search", desc: "We find puppies that match.", icon: (c) => <PeopleIcon color={c} /> },
  { title: "Choose", desc: "Review and pick your favorite.", icon: (c) => <HeartIcon color={c} /> },
  { title: "Reserve", desc: "Reserve your puppy.", icon: (c) => <ShieldCheckIcon color={c} /> },
  { title: "We Pick Up", desc: "We pick up your puppy.", icon: (c) => <TruckIcon color={c} /> },
  { title: "Pickup or Delivery", desc: "Pick up locally or arrange delivery.", icon: (c) => <HouseIcon color={c} /> },
];

function StepRow({ step, index, total, accent }: { step: Step; index: number; total: number; accent: string }) {
  return (
    <div className="hiw-step-row">
      <div className="hiw-step-rail">
        <div className="hiw-step-icon-circle" style={{ background: accent }}>
          {step.icon("#fff")}
          <span className="hiw-step-badge" style={{ color: accent, borderColor: accent }}>
            {index + 1}
          </span>
        </div>
        {index < total - 1 && <div className="hiw-step-line" />}
      </div>
      <div className="hiw-step-body">
        <div className="hiw-step-title">{step.title}</div>
        <div className="hiw-step-desc">{step.desc}</div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <div className="hiw-hero-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/how-it-works-hero.webp"
          width={1440}
          height={677}
          alt="How It Works. Two simple ways to get your perfect puppy. You choose the path that's right for you."
        />
      </div>

      <div className="hiw-intro">
        <h1>Two Ways to Get Your Puppy</h1>
        <p>Choose the option that fits what you&rsquo;re looking for.</p>
      </div>

      <div className="hiw-paths">
        <div className="hiw-path-card">
          <div className="hiw-path-header">
            <div className="hiw-path-icon">
              <PawIcon color="var(--pp-blue)" />
            </div>
            <div>
              <div className="hiw-path-title">Available Puppies</div>
              <div className="hiw-path-tag" style={{ color: "var(--pp-blue)" }}>
                Ready Now
              </div>
            </div>
          </div>
          <p className="hiw-path-desc">Puppies we have now, ready for their new home.</p>

          <div className="hiw-step-list">
            {AVAILABLE_STEPS.map((step, i) => (
              <StepRow key={step.title} step={step} index={i} total={AVAILABLE_STEPS.length} accent="var(--pp-blue)" />
            ))}
          </div>

          <a className="pp-btn-primary hiw-cta" href="/puppies">
            <PawIcon color="#fff" />
            Browse Puppies
          </a>
        </div>

        <div className="hiw-path-card">
          <div className="hiw-path-header">
            <div className="hiw-path-icon" style={{ background: "var(--pp-blue-light)" }}>
              <SearchIcon color="var(--pp-blue-dark)" />
            </div>
            <div>
              <div className="hiw-path-title">Puppy Finder</div>
              <div className="hiw-path-tag" style={{ color: "var(--pp-blue-dark)" }}>
                We Find It For You
              </div>
            </div>
          </div>
          <p className="hiw-path-desc">Don&rsquo;t see what you want? We&rsquo;ll find the right puppy.</p>

          <div className="hiw-step-list">
            {FINDER_STEPS.map((step, i) => (
              <StepRow key={step.title} step={step} index={i} total={FINDER_STEPS.length} accent="var(--pp-blue-dark)" />
            ))}
          </div>

          <a className="pp-btn-primary hiw-cta" href="/puppy-finder">
            <SearchIcon color="#fff" />
            Start Puppy Finder
          </a>
        </div>
      </div>

      <div className="hiw-promise">
        <div className="hiw-promise-item">
          <div className="hiw-promise-icon">
            <ShieldCheckIcon color="var(--pp-blue)" />
          </div>
          <div className="hiw-promise-text">
            <strong>Our Promise</strong>
            <span>Healthy, happy puppies. Honest pricing. Trusted service every step of the way.</span>
          </div>
        </div>
        <div className="hiw-promise-item">
          <div className="hiw-promise-icon">
            <HeartIcon color="var(--pp-blue)" />
          </div>
          <div className="hiw-promise-text">
            <span>Because every puppy deserves the perfect home.</span>
          </div>
        </div>
      </div>
    </>
  );
}
