import "./bundle-section.css";

const ITEMS: { title: string; img?: string }[] = [
  { title: "Brand-New Crate", img: "/bundle-crate.png" },
  { title: "Starter Bag of Food", img: "/bundle-food-diamond.png" },
  { title: "Food & Water Bowls", img: "/bundle-bowls.png" },
  { title: "Pee Pads", img: "/bundle-pee-pads.png" },
  { title: "Potty Bags", img: "/bundle-potty-bags.png" },
  { title: "Health / Shot Records" },
  { title: "Health Guarantee" },
];

function GenericFoodBagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
      <path
        d="M7 3h10l1.5 4.5H5.5L7 3z"
        fill="var(--pp-blue)"
        opacity=".85"
      />
      <path
        d="M5.5 7.5h13L20 20a2 2 0 01-2 2H6a2 2 0 01-2-2l1.5-12.5z"
        fill="var(--pp-blue)"
        opacity=".2"
        stroke="var(--pp-blue)"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="14" r="3" fill="var(--pp-blue)" />
    </svg>
  );
}

function HealthRecordsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="3" fill="var(--pp-blue)" opacity=".15" stroke="var(--pp-blue)" strokeWidth="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="var(--pp-blue)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HealthGuaranteeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
      <path
        d="M12 2l8 3v6c0 5-3.4 9.4-8 10.5C7.4 20.4 4 16 4 11V5l8-3z"
        fill="var(--pp-blue)"
        opacity=".15"
        stroke="var(--pp-blue)"
        strokeWidth="1.5"
      />
      <path d="M9 12l2 2 4-4" stroke="var(--pp-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon({ title }: { title: string }) {
  if (title === "Starter Bag of Food") return <GenericFoodBagIcon />;
  if (title === "Health / Shot Records") return <HealthRecordsIcon />;
  if (title === "Health Guarantee") return <HealthGuaranteeIcon />;
  return null;
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

      <div className="bundle-grid">
        {ITEMS.map((item) => (
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

      <div className="bundle-note">
        <div className="bundle-note-icon">🛍️</div>
        <div className="bundle-note-text">
          <strong>No Pet Store Runs.</strong>
          <span>We&rsquo;ve already taken care of everything you need!</span>
        </div>
      </div>
    </section>
  );
}
