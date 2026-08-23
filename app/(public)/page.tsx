import "./home-sections/home.css";
import { getFeaturedPuppies, getHomepageEventData } from "../../lib/public-data/homepage";
import { getContentBlocksForPage } from "../../lib/content";
import FeaturedPuppies from "./home-sections/FeaturedPuppies";
import PyplCountdown from "./home-sections/PyplCountdown";
import BundleSection from "../../components/public-site/BundleSection";
import PlacementSlot from "../../components/public-site/PlacementSlot";
import PlacementPreviewOverlay from "../../components/public-site/PlacementPreviewOverlay";

export const revalidate = 60;

/**
 * Highlights "Better Way" in blue within the hero headline, matching the
 * approved design. The headline itself stays a single freeform CMS text
 * field (no new content-block keys) - this is purely a render-time
 * accent, not a data-model change. If the text is ever edited to no
 * longer contain that phrase, it just renders as plain text.
 */
function renderHeroHeadline(text: string) {
  const highlight = "Better Way";
  const idx = text.indexOf(highlight);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="blue">{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

const FALLBACK: Record<string, string> = {
  hero_heading_line1: "There's A Better Way To Find Your New Puppy.",
  featured_heading: "Available Puppies",
  finder_heading_line1: "Don't See the",
  finder_heading_line2: "Puppy You Want?",
  finder_subtext: "Tell us what you're looking for.\nWe'll find the right puppy for you.",
};

export default async function HomePage() {
  const text: Record<string, string> = { ...FALLBACK };
  const [puppies, event] = await Promise.all([getFeaturedPuppies(), getHomepageEventData()]);
  try {
    const blocks = await getContentBlocksForPage("homepage");
    for (const block of blocks) {
      if (block.content_type === "text" && block.text_value) {
        text[block.section_key] = block.text_value;
      }
    }
  } catch {
    // Keep fallback content if Supabase is unreachable.
  }

  const showBanner = event.published && event.bannerVisible && event.bannerImageUrl;
  const showCountdown = event.published && event.countdownVisible && event.showAt;

  return (
    <>
      <PlacementSlot pageType="homepage" slot="global_below_header" />
      <PlacementPreviewOverlay pageType="homepage" slot="global_below_header" />

      {showBanner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.bannerImageUrl!} alt="Pick Your Puppy Live" style={{ width: "100%", display: "block" }} />
      )}

      {showCountdown && (
        <PyplCountdown
          eventTitle={event.eventTitle || "Next Pick Your Puppy Live"}
          showAt={event.showAt!}
          registrationLink={event.registrationLink || "/inquire?type=pypl"}
        />
      )}

      <PlacementSlot pageType="homepage" slot="homepage_hero" />
      <PlacementPreviewOverlay pageType="homepage" slot="homepage_hero" />

      <section className="hero" id="home">
        <div className="hero-top">
          <div className="hero-text">
            <h1>{renderHeroHeadline(text.hero_heading_line1)}</h1>
            <div className="hero-btns">
              <a className="pp-btn-primary" href="/puppies">
                View Puppies ›
              </a>
              <a className="pp-btn-outline" href="/how-it-works">
                How It Works
              </a>
            </div>
          </div>
          <div className="hero-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-yorkie.jpg" width={600} height={450} alt="Yorkie puppy" />
            <div className="hero-dots">
              <span className="pp-active" />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="featured">
        <div className="section-header">
          <h2 className="section-title">{text.featured_heading}</h2>
          <a className="view-all" href="/puppies">
            View All ›
          </a>
        </div>
        <FeaturedPuppies puppies={puppies} />
      </section>

      <PlacementSlot pageType="homepage" slot="homepage_below_puppies" />
      <PlacementPreviewOverlay pageType="homepage" slot="homepage_below_puppies" />

      <section className="finder-promo">
        <div className="finder-promo-top">
          <div className="finder-promo-text">
            <h2>
              {text.finder_heading_line1}
              <br />
              <span className="blue">{text.finder_heading_line2}</span>
            </h2>
            <p>
              {text.finder_subtext.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="finder-promo-img" src="/finder-puppy.webp" width={282} height={370} alt="Cute puppy" />
        </div>

        <div className="finder-divider">
          <div className="finder-divider-line" />
          <div className="finder-divider-label">Tell Us What You&rsquo;re Looking For</div>
          <div className="finder-divider-line" />
        </div>

        <div className="finder-pills">
          <div className="finder-pill">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="11" r="5" stroke="#1B7BFF" strokeWidth="1.8" />
              <path d="M7 9c0-1 .5-2 1.5-2.5M17 9c0-1-.5-2-1.5-2.5" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
              <ellipse cx="12" cy="18" rx="6" ry="2.5" stroke="#1B7BFF" strokeWidth="1.5" />
            </svg>
            Breed
          </div>
          <div className="finder-pill">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="9" cy="9" r="5" stroke="#E85D9C" strokeWidth="1.8" />
              <path d="M9 14v6M6.5 17.5h5" stroke="#E85D9C" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="17" cy="15" r="4.2" stroke="#E85D9C" strokeWidth="1.8" />
              <path d="M20 12l2.5-2.5M20 9.5h2.5V12" stroke="#E85D9C" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Gender
          </div>
          <div className="finder-pill">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M12 3a9 9 0 100 18c1.1 0 1.7-.9 1.2-1.8-.3-.6.1-1.3.8-1.3H16a5 5 0 005-5c0-5.5-4-10-9-10z"
                stroke="#F59E0B"
                strokeWidth="1.6"
              />
              <circle cx="8" cy="10" r="1.2" fill="#F59E0B" />
              <circle cx="12" cy="7.5" r="1.2" fill="#E85D9C" />
              <circle cx="16" cy="10" r="1.2" fill="#1B7BFF" />
            </svg>
            Color
          </div>
          <div className="finder-pill">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 1v22M17 5.5H9.5a3 3 0 000 6h5a3 3 0 010 6H6" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Budget
          </div>
          <div className="finder-pill">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2" stroke="#7C3AED" strokeWidth="1.8" />
              <path d="M3 9h18M8 2v4M16 2v4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Timeframe
          </div>
          <div className="finder-pill">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M3 11l9-8 9 8M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"
                stroke="#0EA5E9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Other
          </div>
        </div>

        <a className="pp-btn-primary finder-cta" href="/puppy-finder">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
            <path d="M4 4h16v16H4z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M4 5l8 7 8-7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Request a Puppy ›
        </a>

        <div className="finder-note">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 2L4 5v6c0 5 3.4 9.4 8 10.5C16.6 20.4 20 16 20 11V5l-8-3z" fill="#1B7BFF" />
            <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          No pressure. No obligation. Just cute puppies. 💙
        </div>
      </section>

      <BundleSection />
    </>
  );
}
