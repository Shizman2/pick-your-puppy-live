import "./puppy-finder.css";
import FinderForm from "./FinderForm";
import PlacementSlot from "../../../components/public-site/PlacementSlot";


export const metadata = {
  title: "Puppy Finder Concierge – ThePuppyPlugs.com",
};

export default function PuppyFinderPage({
  searchParams,
}: {
  searchParams: { previewToken?: string };
}) {
  const previewToken = searchParams?.previewToken || null;
  return (
    <>
      <PlacementSlot pageType="puppy_finder" slot="global_below_header" previewToken={previewToken} />

      <section className="finder-hero">
        <div className="finder-hero-text">
          <h1>
            Can&rsquo;t Find the Puppy You&rsquo;re <span className="accent">Looking For?</span>
          </h1>
          <div className="finder-hero-sub">Let us do the searching for you.</div>
          <p>
            Through our trusted breeder network, we&rsquo;ll help locate the puppy you&rsquo;ve been dreaming of,
            coordinate the process, and personally handle everything from search to pickup or delivery.
          </p>
          <a className="pp-btn-primary" href="#finderForm">
            🐾 Start My Puppy Search
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="finder-hero-img" src="/concierge-hero-puppy.jpg" alt="Cute puppy" />
      </section>

      <PlacementSlot pageType="puppy_finder" slot="puppy_finder_hero" previewToken={previewToken} />

      <section className="section">
        <div className="section-title">How It Works</div>
        <div className="timeline-divider">
          <span className="line" />
          <span style={{ fontSize: 13 }}>🐾</span>
          <span className="line" />
        </div>

        <div className="timeline-wrap">
          <div className="timeline-rail" />

          <div className="timeline-step">
            <div className="timeline-num">1</div>
            <div className="timeline-card">
              <div className="timeline-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <rect x="5" y="3" width="14" height="18" rx="2" stroke="#1B7BFF" strokeWidth="1.8" />
                  <path d="M9 8h6M9 12h6M9 16h3" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M15 3l3 3" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="timeline-title">Fill Out the Form</div>
              <div className="timeline-desc">Tell us what you&rsquo;re looking for and your puppy preferences.</div>
            </div>
          </div>

          <div className="timeline-step">
            <div className="timeline-num">2</div>
            <div className="timeline-card">
              <div className="timeline-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <circle cx="10" cy="10" r="6" stroke="#1B7BFF" strokeWidth="1.8" />
                  <path d="M15 15l5 5" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="timeline-title">We Find Your Puppy</div>
              <div className="timeline-desc">
                We&rsquo;ll search our trusted breeder network to locate puppies that match your request.
              </div>
            </div>
          </div>

          <div className="timeline-step">
            <div className="timeline-num">3</div>
            <div className="timeline-card">
              <div className="timeline-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path
                    d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"
                    stroke="#1B7BFF"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <div className="timeline-title">Choose Your Puppy</div>
              <div className="timeline-desc">
                We&rsquo;ll send photos, videos, pricing, and available puppies so you can choose the one you love.
              </div>
            </div>
          </div>

          <div className="timeline-step">
            <div className="timeline-num">4</div>
            <div className="timeline-card">
              <div className="timeline-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <rect x="1" y="8" width="14" height="9" rx="2" stroke="#1B7BFF" strokeWidth="1.6" />
                  <path d="M15 10h4l3 4v3h-7v-7z" stroke="#1B7BFF" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="6" cy="18.5" r="2" stroke="#1B7BFF" strokeWidth="1.6" />
                  <circle cx="18" cy="18.5" r="2" stroke="#1B7BFF" strokeWidth="1.6" />
                </svg>
              </div>
              <div className="timeline-title">We Pick Up Your Puppy</div>
              <div className="timeline-desc">
                Once you&rsquo;ve chosen your puppy, we&rsquo;ll coordinate pickup from one of our trusted breeders.
              </div>
            </div>
          </div>

          <div className="timeline-step">
            <div className="timeline-num">5</div>
            <div className="timeline-card">
              <div className="timeline-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path
                    d="M3 11l9-8 9 8M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"
                    stroke="#1B7BFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="timeline-title">Bring Your Puppy Home</div>
              <div className="timeline-desc">
                We&rsquo;ll prepare your Starter Bundle and coordinate pickup or delivery so you can welcome your new
                best friend home.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">What&rsquo;s Included</div>
        <div className="section-sub">With Puppy Finder Concierge</div>
        <div className="included-list">
          {[
            "Personalized puppy search",
            "Trusted breeder network",
            "Photos & videos",
            "Health verification",
            "Health records",
            "Health guarantee",
            "Pickup coordination",
            "Delivery coordination",
            "New Puppy Starter Bundle",
            "Ongoing customer support",
          ].map((item) => (
            <div className="included-item" key={item}>
              <span className="included-check">✓</span> {item}
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="price-card">
          <div className="price-card-icon">💙</div>
          <div className="price-card-title">Puppy Finder Concierge</div>
          <div className="price-card-amount">$250</div>
          <div className="price-card-desc">
            The concierge fee covers the time and work involved in locating, coordinating, and securing your puppy.
            Your puppy&rsquo;s purchase price is separate and depends on breed, age, availability, and breeder
            pricing.
          </div>
          <div className="price-card-note">
            💙 Our puppies generally start at <b>$1,250</b>.
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <PlacementSlot pageType="puppy_finder" slot="puppy_finder_above_form" previewToken={previewToken} />
        <FinderForm />
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">Common Questions</div>
        <div className="faq-item">
          <div className="faq-q">How long does it take?</div>
          <div className="faq-a">
            Every search is different. Some puppies can be located quickly, while others may take longer depending on
            breed and availability.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-q">Is the $250 applied toward the puppy?</div>
          <div className="faq-a">
            No. The Puppy Finder Concierge fee covers the personalized search, breeder coordination, and sourcing
            process.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-q">Do I have to buy a puppy if you find one?</div>
          <div className="faq-a">No. We&rsquo;ll present available options, and the decision is always yours.</div>
        </div>
        <div className="faq-item">
          <div className="faq-q">Can you find specific colors?</div>
          <div className="faq-a">
            We&rsquo;ll do our best to match your preferences, but availability depends on our breeder network.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-q">Do you deliver?</div>
          <div className="faq-a">Yes. We offer pickup coordination and delivery options depending on your location.</div>
        </div>
      </section>

      <div className="final-cta">
        <h2>Ready to Find Your Perfect Puppy?</h2>
        <p>Skip the searching and let us do the work.</p>
        <a className="pp-btn-primary" href="#finderForm">
          🐾 Start My Puppy Search
        </a>
      </div>
    </>
  );
}
