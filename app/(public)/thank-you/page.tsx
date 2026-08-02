import "./thank-you.css";
import ShareButtons from "./ShareButtons";

export const metadata = {
  title: "Thank You – ThePuppyPlugs.com",
};

export default function ThankYouPage() {
  return (
    <>
      <div className="ty-hero">
        <div className="check-circle">✓</div>
        <div className="paw-anim">🐾</div>
        <h1>
          You&rsquo;re One Step Closer to Your <span className="blue">Perfect Puppy!</span>
        </h1>
        <p>
          We received your message and will be in touch within a few hours. Get ready — your new best friend is
          almost home!
        </p>
      </div>

      <div className="next-section">
        <h2>What Happens Next</h2>
        <div className="next-step">
          <div className="step-num">1</div>
          <div className="step-text">
            <h3>We Review Your Request</h3>
            <p>Our team reviews your inquiry and confirms the puppy is still available. This usually takes just a few hours.</p>
          </div>
        </div>
        <div className="next-step">
          <div className="step-num">2</div>
          <div className="step-text">
            <h3>We Reach Out to You</h3>
            <p>We&rsquo;ll contact you by phone or email to answer any questions and walk you through the next steps.</p>
          </div>
        </div>
        <div className="next-step">
          <div className="step-num">3</div>
          <div className="step-text">
            <h3>Reserve with a Deposit</h3>
            <p>A small $200 deposit holds your puppy so no one else can claim them while you finalize everything.</p>
          </div>
        </div>
        <div className="next-step">
          <div className="step-num">4</div>
          <div className="step-text">
            <h3>Your Puppy Comes Home</h3>
            <p>We arrange safe delivery or local pickup. Your puppy arrives healthy, happy, and ready to meet you!</p>
          </div>
        </div>
      </div>

      <div className="contact-remind">
        <div className="icon">📞</div>
        <p>
          Need an answer sooner? Call or text us directly at <strong>(555) 123-4567</strong> — we&rsquo;re happy to
          help!
        </p>
      </div>

      <div className="share-card">
        <h2>Know Someone Who Wants a Puppy?</h2>
        <p>Share ThePuppyPlugs.com with a friend and help them find their perfect match too!</p>
        <ShareButtons />
      </div>

      <div className="ty-cta">
        <a className="pp-btn-primary" href="/puppies">
          Browse All Puppies ›
        </a>
        <a className="pp-btn-outline" href="/">
          Back to Home
        </a>
      </div>
    </>
  );
}
