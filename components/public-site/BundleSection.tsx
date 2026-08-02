import "./bundle-section.css";

const ROW_1: { title: string; img?: string }[] = [
  { title: "Health Guarantee" },
  { title: "Health / Shot Records" },
  { title: "Bag of Food", img: "/bundle-food-diamond.png" },
  { title: "Crate", img: "/bundle-crate.png" },
];

const ROW_2: { title: string; img?: string }[] = [
  { title: "Food & Water Bowls", img: "/bundle-bowls.png" },
  { title: "Pee Pads", img: "/bundle-pee-pads.png" },
  { title: "Potty Bags", img: "/bundle-potty-bags.png" },
];

function HealthGuaranteeShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" width="30" height="30" fill="none">
      <path
        d="M24 5l15 6v11c0 9.4-6.4 17.6-15 20-8.6-2.4-15-10.6-15-20V11l15-6z"
        stroke="var(--pp-blue)"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M24 5l15 6v11c0 9.4-6.4 17.6-15 20-8.6-2.4-15-10.6-15-20V11l15-6z"
        stroke="var(--pp-blue)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M24 15v18M15 24h18" stroke="var(--pp-blue)" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function HealthShotRecordsClipboardIcon() {
  return (
    <svg viewBox="0 0 48 48" width="30" height="30" fill="none">
      <rect x="10" y="7" width="28" height="36" rx="4" stroke="var(--pp-blue)" strokeWidth="2.4" fill="none" opacity="0.9" />
      <rect x="17" y="4" width="14" height="7" rx="2" fill="var(--pp-blue)" />
      {[15, 22, 29].map((y) => (
        <g key={y}>
          <path d={`M16 ${y}l2.2 2.2L22 ${y - 3.4}`} stroke="var(--pp-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M26 ${y}h9`} stroke="var(--pp-blue)" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function CardIcon({ title }: { title: string }) {
  if (title === "Health Guarantee") return <HealthGuaranteeShieldIcon />;
  if (title === "Health / Shot Records") return <HealthShotRecordsClipboardIcon />;
  return null;
}

function BundleGrid({ items, extraClass }: { items: { title: string; img?: string }[]; extraClass?: string }) {
  return (
    <div className={`bundle-grid${extraClass ? ` ${extraClass}` : ""}`}>
      {items.map((item) => (
        <div className="bundle-card" key={item.title}>
          {item.img ? (
            <div className="bundle-card-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.img} alt={item.title} />
            </div>
          ) : (
            <div className="bundle-card-icon">
              <CardIcon title={item.title} />
            </div>
          )}
          <div className="bundle-card-title">{item.title}</div>
        </div>
      ))}
    </div>
  );
}

export default function BundleSection() {
  return (
    <section className="bundle-section">
      <div className="bundle-header">
        <h2>
          🐾 What Comes With Your Puppy 🐾
        </h2>
        <div className="divider">
          <span className="divider-line" />
          <span>💙</span>
          <span className="divider-line" />
        </div>
        <p>
          Our all-inclusive starter bundle has everything you need to bring your puppy home happy &amp; healthy.
        </p>
      </div>

      <div className="bundle-hero-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bundle-hero-composite.png" alt="Puppy starter bundle: crate, food, bowls, pee pads, potty bags" />
      </div>

      <BundleGrid items={ROW_1} />
      <BundleGrid items={ROW_2} extraClass="bundle-grid-3" />

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
        <div className="bundle-note-text">
          <strong>No Pet Store Runs.</strong>
          <span>We&rsquo;ve already taken care of everything you need!</span>
        </div>
        <div className="bundle-note-heart">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M12 3v6M9 4l1 5M15 4l-1 5" stroke="var(--pp-blue)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <svg viewBox="0 0 48 48" width="30" height="30" fill="none">
            <path
              d="M24 40C10 30 4 22 4 14.5 4 8.5 8.8 4 14.5 4c3.4 0 6.6 1.7 8.5 4.4C24.9 5.7 28.1 4 31.5 4 37.2 4 42 8.5 42 14.5 42 22 36 30 24 40z"
              stroke="var(--pp-blue)"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
