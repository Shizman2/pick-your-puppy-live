import "./how-it-works.css";

export const metadata = {
  title: "How It Works – ThePuppyPlugs.com",
};

export default function HowItWorksPage() {
  return (
    <>
      <div className="page-title">How It Works</div>
      <div className="page-sub">
        Finding and bringing home your new best friend is simple. Here&rsquo;s exactly what to expect, from browsing
        to delivery day.
      </div>

      <div className="steps-detail">
        <div className="step-card">
          <div className="step-card-top">
            <div className="step-num">1</div>
            <div className="step-icon">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                <circle cx="14" cy="14" r="8" stroke="#1B7BFF" strokeWidth="2.5" />
                <path d="M20 20L27 27" stroke="#1B7BFF" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="step-title">Browse Puppies</div>
          </div>
          <div className="step-body">
            Explore our available puppies, complete with real photos, breed details, age, and pricing. Not sure
            exactly what you&rsquo;re looking for? Use our Puppy Finder service and our team will help track down
            your ideal match.
          </div>
        </div>

        <div className="step-card">
          <div className="step-card-top">
            <div className="step-num">2</div>
            <div className="step-icon">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                <rect x="6" y="4" width="20" height="24" rx="4" fill="#1B7BFF" opacity=".15" stroke="#1B7BFF" strokeWidth="2" />
                <circle cx="16" cy="16" r="5" stroke="#1B7BFF" strokeWidth="2" />
                <path d="M16 13v3l2 2" stroke="#1B7BFF" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="step-title">Reserve Securely</div>
          </div>
          <div className="step-body">
            Found the one? Reach out through our contact form to reserve your puppy. Our team will walk you through
            the next steps and answer any questions about health records, vaccinations, or timing.
          </div>
        </div>

        <div className="step-card">
          <div className="step-card-top">
            <div className="step-num">3</div>
            <div className="step-icon">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                <path
                  d="M16 4L4 14v14h8v-8h8v8h8V14L16 4z"
                  fill="#1B7BFF"
                  opacity=".15"
                  stroke="#1B7BFF"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="step-title">Bring Home</div>
          </div>
          <div className="step-body">
            Once everything&rsquo;s confirmed, we coordinate safe delivery or pickup, whichever works best for you.
            Every puppy arrives vet-checked, vaccinated, and ready to settle into their new home.
          </div>
        </div>
      </div>

      <div className="faq-mini">
        <div className="faq-mini-title">Common Questions</div>
        <div className="faq-mini-item">
          <div className="faq-mini-q">Are your puppies vet-checked?</div>
          <div className="faq-mini-a">Yes - every puppy is vet-checked and vaccinated before going to their new home.</div>
        </div>
        <div className="faq-mini-item">
          <div className="faq-mini-q">Do you offer delivery?</div>
          <div className="faq-mini-a">Yes - delivery is available nationwide for most puppies. Check each puppy&rsquo;s listing for details.</div>
        </div>
        <div className="faq-mini-item">
          <div className="faq-mini-q">Have more questions?</div>
          <div className="faq-mini-a">Visit our full FAQ page or reach out directly - we&rsquo;re happy to help.</div>
        </div>
      </div>

      <div className="cta-wrap">
        <a className="pp-btn-primary" href="/puppies">
          Browse Available Puppies ›
        </a>
      </div>
    </>
  );
}
