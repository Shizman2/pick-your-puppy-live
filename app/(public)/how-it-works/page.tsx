import "./how-it-works.css";
import BundleSection from "../../../components/public-site/BundleSection";

export const metadata = {
  title: "How It Works – ThePuppyPlugs.com",
};

function StepIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d={path} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <section className="hiw-hero">
        <div className="hiw-hero-text">
          <h1>How It Works</h1>
          <div className="hiw-hero-underline" />
          <p>
            Finding your puppy should be simple. Browse, reserve, and bring your new best friend home — we&rsquo;ll
            help you through every step.
          </p>
        </div>
        <div className="hiw-hero-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hiw-hero.png" width={400} height={307} alt="Cute puppy" />
        </div>
      </section>

      <div className="hiw-steps">
        <div className="hiw-step-card">
          <div className="hiw-step-num-col">
            <div className="hiw-step-num">01</div>
            <div className="hiw-step-icon">
              <StepIcon path="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35" />
            </div>
            <div className="hiw-step-line" />
          </div>
          <div className="hiw-step-body">
            <div className="hiw-step-title">Find Your Puppy</div>
            <div className="hiw-step-desc">
              Browse available puppies with real photos, pricing, age, breed &amp; availability. If you don&rsquo;t
              see what you want, click Request to use our Puppy Finder service &amp; our team will find the puppy
              you want.
            </div>
            <div className="hiw-step-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hiw-step1.png" width={400} height={566} alt="Available Puppies listing on phone" />
            </div>
          </div>
        </div>

        <div className="hiw-step-card">
          <div className="hiw-step-num-col">
            <div className="hiw-step-num">02</div>
            <div className="hiw-step-icon">
              <StepIcon path="M20 6L9 17l-5-5" />
            </div>
            <div className="hiw-step-line" />
          </div>
          <div className="hiw-step-body">
            <div className="hiw-step-title">Reserve Your Puppy</div>
            <div className="hiw-step-desc">
              If you&rsquo;ve found the puppy you want, tap Reserve This Puppy on the puppy&rsquo;s info page to
              start the process.
            </div>
            <div className="hiw-step-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hiw-step2.png" width={400} height={423} alt="Reservation started confirmation on phone" />
            </div>
          </div>
        </div>

        <div className="hiw-step-card">
          <div className="hiw-step-num-col">
            <div className="hiw-step-num">03</div>
            <div className="hiw-step-icon">
              <StepIcon path="M3 12L12 4l9 8M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
            </div>
          </div>
          <div className="hiw-step-body">
            <div className="hiw-step-title">Bring Your Puppy Home</div>
            <div className="hiw-step-desc">
              We coordinate pickup or delivery so it&rsquo;s easy for you. Every puppy comes vet-checked, vaccinated
              &amp; with everything you need to bring your puppy home. <strong>No pet store runs.</strong>
            </div>
            <div className="hiw-step-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hiw-step3.png" width={400} height={381} alt="Puppy in a ThePuppyPlugs.com delivery crate" />
            </div>
          </div>
        </div>
      </div>

      <BundleSection />

      <div className="hiw-questions">
        <div className="hiw-questions-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
              stroke="var(--pp-blue)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M12 15.5v.01M9.5 9.7a2.5 2.5 0 114 2c-.6.5-1 .9-1 1.8" stroke="var(--pp-blue)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="hiw-questions-title">Still Have Questions?</div>
          <div className="hiw-questions-desc">
            Everything from deposits and delivery to health records and pickup is covered in our FAQ.
          </div>
          <div className="hiw-questions-btns">
            <a className="hiw-btn-outline" href="/faq">
              View FAQs ›
            </a>
            <a className="hiw-btn-outline" href="/contact">
              Contact Us ›
            </a>
          </div>
        </div>
      </div>

      <div className="hiw-final-cta">
        <a className="pp-btn-primary" href="/puppies">
          Browse Available Puppies ›
        </a>
      </div>
    </>
  );
}
