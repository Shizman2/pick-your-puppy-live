import "./about.css";
import { getContentBlocksForPage } from "../../../lib/content";


export const metadata = {
  title: "About Us – ThePuppyPlugs.com",
};

const FALLBACK: Record<string, string> = {
  hero_heading: "We Love Puppies. Just Like You Do.",
  hero_subtext: "ThePuppyPlugs.com was created to make finding your perfect puppy easy, safe, and affordable.",
  story_p1:
    "ThePuppyPlugs.com started with one simple idea — everyone deserves the chance to bring home a healthy, happy puppy without paying outrageous prices or worrying about whether the breeder is legit.",
  story_p2:
    "We connect families with trusted, responsible breeders who share our values: healthy puppies, honest pricing, and happy homes. Every puppy on our site is vet-checked, vaccinated, and comes with full health records before going anywhere.",
  cta_heading: "Ready to Find Your Puppy?",
  cta_text: "Hundreds of families have found their perfect match. You're next.",
};

export default async function AboutPage() {
  const text: Record<string, string> = { ...FALLBACK };
  try {
    const blocks = await getContentBlocksForPage("about");
    for (const block of blocks) {
      if (block.content_type === "text" && block.text_value) {
        text[block.section_key] = block.text_value;
      }
    }
  } catch {
    // Keep fallback content if Supabase is unreachable.
  }

  return (
    <>
      <div className="about-hero">
        <div className="icon">🐾</div>
        <h1>{text.hero_heading}</h1>
        <p>{text.hero_subtext}</p>
      </div>

      <div className="stats-row">
        <div className="stat">
          <div className="stat-num">500+</div>
          <div className="stat-label">Puppies Placed</div>
        </div>
        <div className="stat">
          <div className="stat-num">100%</div>
          <div className="stat-label">Health Certified</div>
        </div>
        <div className="stat">
          <div className="stat-num">4.9★</div>
          <div className="stat-label">Avg. Rating</div>
        </div>
      </div>

      <div className="about-section">
        <h2>Our Story</h2>
        <p>{text.story_p1}</p>
        <p>{text.story_p2}</p>
      </div>

      <div className="mission-grid">
        <div className="mission-card">
          <div className="icon">💛</div>
          <h3>Affordable Prices</h3>
          <p>Great puppies shouldn&rsquo;t cost a fortune. We keep prices fair.</p>
        </div>
        <div className="mission-card">
          <div className="icon">🛡️</div>
          <h3>Trusted Breeders</h3>
          <p>Every breeder is vetted. No puppy mills. Ever.</p>
        </div>
        <div className="mission-card">
          <div className="icon">💉</div>
          <h3>Health First</h3>
          <p>All puppies are vet-cleared with full vaccination records.</p>
        </div>
        <div className="mission-card">
          <div className="icon">🚚</div>
          <h3>Safe Delivery</h3>
          <p>We deliver safely to your door anywhere in the US.</p>
        </div>
      </div>

      <div className="promise-list">
        <h2>Our Promise to You</h2>
        <div className="promise-item">
          <div className="promise-emoji">✅</div>
          <div>
            <h3>No Puppy Mills</h3>
            <p>We personally vet every breeder. We only work with responsible, caring breeders who raise puppies in their homes.</p>
          </div>
        </div>
        <div className="promise-item">
          <div className="promise-emoji">💰</div>
          <div>
            <h3>Fair, Transparent Pricing</h3>
            <p>The price you see is the price you pay. No hidden fees or surprise charges.</p>
          </div>
        </div>
        <div className="promise-item">
          <div className="promise-emoji">🏥</div>
          <div>
            <h3>30-Day Health Guarantee</h3>
            <p>Every puppy comes with a 30-day health guarantee. We make it right.</p>
          </div>
        </div>
        <div className="promise-item">
          <div className="promise-emoji">📞</div>
          <div>
            <h3>Real Human Support</h3>
            <p>Real people, real answers — before and after your purchase.</p>
          </div>
        </div>
      </div>

      <div className="about-cta">
        <h2>{text.cta_heading}</h2>
        <p>{text.cta_text}</p>
        <a className="btn-white" href="/puppies">
          Browse Puppies ›
        </a>
      </div>
    </>
  );
}
