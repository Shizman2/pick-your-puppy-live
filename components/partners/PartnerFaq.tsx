"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How much do I earn?",
    a: "Your commission is set when you're approved and shown on your partner dashboard - it applies to every completed puppy sale that comes through your link.",
  },
  {
    q: "When do commissions get approved?",
    a: "A commission stays pending until the puppy has actually been delivered/picked up and the sale is paid in full, plus a short veterinary hold period after that - then it's automatically approved.",
  },
  {
    q: "Can I promote a specific puppy?",
    a: "Yes - from your Marketing & Creatives page you can get a tracked link straight to any individual puppy's listing, not just your general referral link.",
  },
  {
    q: "Do I get my own link?",
    a: "Yes - every approved partner gets a unique referral code and link, shown on your dashboard, that tracks every visitor and sale back to you.",
  },
  {
    q: "Is there a cost to join?",
    a: "No - joining the Partner Program is completely free. You only need to fill out the application below.",
  },
];

/**
 * Flat list, not the category-grouped accordion /faq uses - reuses that
 * page's exact .faq-item/.faq-q/.faq-icon/.faq-a CSS (imported via
 * partner-landing.css) for the same rounded-row look, without pulling
 * in the category header wrapper this page doesn't need.
 */
export default function PartnerFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="partner-section">
      <h2 className="partner-section-title">Frequently Asked Questions</h2>

      <div className="faq-list partner-faq-list">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className={`faq-item${isOpen ? " pp-open" : ""}`} onClick={() => setOpenIndex(isOpen ? null : i)}>
              <div className="faq-q">
                <span>{item.q}</span>
                <span className="faq-icon">+</span>
              </div>
              {isOpen && <div className="faq-a">{item.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
