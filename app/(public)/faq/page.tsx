import "./faq.css";
import FaqAccordion from "./FaqAccordion";

export const metadata = {
  title: "FAQ – ThePuppyPlugs.com",
};

export default function FaqPage() {
  return (
    <>
      <div className="faq-hero">
        <div className="icon">❓</div>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know before bringing your puppy home.</p>
      </div>

      <FaqAccordion />

      <div className="faq-still">
        <h3>Still have questions?</h3>
        <p>We are happy to help. Reach out and we will get back to you within a few hours.</p>
        <a className="pp-btn-primary" href="/contact">
          Contact Us ›
        </a>
      </div>
    </>
  );
}
