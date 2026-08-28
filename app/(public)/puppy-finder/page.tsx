import "./puppy-finder.css";
import "../../../components/public-site/shareButtons.css";
import FinderForm from "./FinderForm";
import PlacementSlot from "../../../components/public-site/PlacementSlot";
import PlacementPreviewOverlay from "../../../components/public-site/PlacementPreviewOverlay";
import ShareButtons from "../../../components/public-site/ShareButtons";
import { getContentBlocksForPage } from "../../../lib/content";

export const metadata = {
  title: "Puppy Finder Concierge – ThePuppyPlugs.com",
};

function PersonIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="#1B7BFF" strokeWidth="1.8" />
      <path
        d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6"
        stroke="#1B7BFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="#1B7BFF" strokeWidth="1.8" />
      <path d="M9 8h6M9 12h6M9 16h3" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 3l3 3" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <circle cx="10" cy="10" r="6" stroke="#1B7BFF" strokeWidth="1.8" />
      <path d="M15 15l5 5" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#1B7BFF" strokeWidth="1.8" />
      <circle cx="8" cy="10" r="1.8" stroke="#1B7BFF" strokeWidth="1.6" />
      <path d="M3 17l5.5-5 4 3.5L17 11l4 5" stroke="#1B7BFF" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path
        d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"
        stroke="#1B7BFF"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M4 16v-3.5L6 8h12l2 4.5V16M4 16a1.5 1.5 0 003 0M4 16h3m10 0a1.5 1.5 0 003 0m-3 0h3M7 12h10"
        stroke="#1B7BFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M3 11l9-8 9 8M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"
        stroke="#1B7BFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldStarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
      <path
        d="M12 3l7 3v6c0 5-3.5 8.5-7 9.5C8.5 20.5 5 17 5 12V6l7-3z"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.3l1.1 2.2 2.4.35-1.75 1.7.4 2.35L12 13.75l-2.15 1.15.4-2.35-1.75-1.7 2.4-.35L12 8.3z"
        fill="#fff"
      />
    </svg>
  );
}

interface TimelineStep {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface TimelinePhase {
  label: string;
  icon: React.ReactNode;
  steps: TimelineStep[];
}

const PHASES: TimelinePhase[] = [
  {
    label: "YOU TELL US",
    icon: <PersonIcon size={16} />,
    steps: [
      { title: "Tell Us What You Want", desc: "Tell us exactly what you're looking for.", icon: <ClipboardIcon /> },
    ],
  },
  {
    label: "WE DO THE WORK",
    icon: <SearchIcon size={16} />,
    steps: [
      { title: "We Search", desc: "We find puppies that match your request.", icon: <SearchIcon /> },
      { title: "Review Your Options", desc: "See your personalized puppy matches.", icon: <PhotoIcon /> },
    ],
  },
  {
    label: "YOU CHOOSE — WE HANDLE THE REST",
    icon: <HeartIcon size={16} />,
    steps: [
      { title: "Choose & Reserve", desc: "Choose your puppy and reserve it.", icon: <HeartIcon /> },
      { title: "We Pick Up Your Puppy", desc: "We coordinate pickup and handle the details.", icon: <CarIcon /> },
      { title: "Bring Your Puppy Home", desc: "Choose local pickup or delivery.", icon: <HouseIcon /> },
    ],
  },
];

// Flattened once at module scope so each step keeps one continuous 1-6
// number across phase groups, without a mutable counter inside the render.
type TimelineItem =
  | { kind: "phase"; label: string; icon: React.ReactNode }
  | { kind: "step"; number: number; title: string; desc: string; icon: React.ReactNode };

const TIMELINE_ITEMS: TimelineItem[] = (() => {
  const items: TimelineItem[] = [];
  let stepNumber = 0;
  for (const phase of PHASES) {
    items.push({ kind: "phase", label: phase.label, icon: phase.icon });
    for (const step of phase.steps) {
      stepNumber += 1;
      items.push({ kind: "step", number: stepNumber, title: step.title, desc: step.desc, icon: step.icon });
    }
  }
  return items;
})();

export default async function PuppyFinderPage() {
  let heroImage = "/concierge-hero-puppy.jpg";
  try {
    const blocks = await getContentBlocksForPage("puppy_finder");
    const heroBlock = blocks.find((b) => b.section_key === "hero_image");
    if (heroBlock?.content_type === "image" && heroBlock.image_url) {
      heroImage = heroBlock.image_url;
    }
  } catch {
    // Keep the default static image if Supabase is unreachable.
  }

  return (
    <>
      <PlacementSlot pageType="puppy_finder" slot="global_below_header" />
      <PlacementPreviewOverlay pageType="puppy_finder" slot="global_below_header" />

      <section className="finder-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="finder-hero-img" src={heroImage} alt="Puppy Finder Concierge" />
      </section>

      <PlacementSlot pageType="puppy_finder" slot="puppy_finder_hero" />
      <PlacementPreviewOverlay pageType="puppy_finder" slot="puppy_finder_hero" />

      <section className="section">
        <div className="section-title">How Our Puppy Finder Works</div>
        <div className="section-sub">We handle the search so you can focus on the excitement.</div>

        <div className="timeline-wrap">
          <div className="timeline-rail" />

          {TIMELINE_ITEMS.map((item) =>
            item.kind === "phase" ? (
              <div className="phase-label-row" key={`phase-${item.label}`}>
                <span className="phase-label-icon">{item.icon}</span>
                <span className="phase-label-text">{item.label}</span>
                <span className="phase-label-line" />
              </div>
            ) : (
              <div className="timeline-step" key={item.title}>
                <div className="timeline-num">{item.number}</div>
                <div className="timeline-card">
                  <div className="timeline-icon">{item.icon}</div>
                  <div className="timeline-card-text">
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-desc">{item.desc}</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="concierge-card">
          <div className="concierge-main">
            <div className="concierge-icon">
              <ShieldStarIcon />
            </div>
            <div className="concierge-title">We Handle Everything For You</div>
            <div className="concierge-desc">
              Sourcing. Due diligence. Coordination. Pickup. Delivery. We handle the details so you can enjoy the
              experience.
            </div>
          </div>
          <div className="concierge-divider" />
          <div className="concierge-included">
            <div className="concierge-included-label">Puppy Finder Concierge</div>
            <div className="concierge-included-badge">INCLUDED</div>
            <div className="concierge-included-rule" />
            <div className="concierge-included-note-bold">No additional fee.</div>
            <div className="concierge-included-note-blue">It&apos;s all part of the service.</div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">Ready to Find Your Perfect Puppy?</div>
        <div className="section-sub" style={{ marginBottom: 0 }}>
          Fill out the form and let us get to work!
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <PlacementSlot pageType="puppy_finder" slot="puppy_finder_above_form" />
        <PlacementPreviewOverlay pageType="puppy_finder" slot="puppy_finder_above_form" />
        <FinderForm />
      </section>

      <ShareButtons
        heading="Share This Page"
        smsMessage="Check out our Puppy Finder"
        shareText="Check out our Puppy Finder!"
        shareTitle="Puppy Finder – ThePuppyPlugs.com"
      />
    </>
  );
}
