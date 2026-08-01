"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How do I reserve a puppy?",
    a: 'Simply click "Reserve This Puppy" on any puppy detail page and fill out the short form. We will contact you within 24 hours to confirm availability and walk you through the next steps. A small deposit holds your puppy.',
  },
  {
    q: "How much is the deposit?",
    a: "We require a $200 deposit to hold your puppy. This deposit is applied toward your total purchase price. Deposits are refundable if the puppy has a vet-confirmed health issue.",
  },
  {
    q: "Do you offer delivery?",
    a: "Yes! We offer safe, professional pet transport delivery to your door anywhere in the United States. Delivery fees vary by location and will be quoted when you reserve. We can also arrange local pickup.",
  },
  {
    q: "Are the puppies vet checked?",
    a: "Absolutely. Every single puppy on our site has been examined by a licensed veterinarian, is up to date on age-appropriate vaccines, has been dewormed, and comes with a full health record.",
  },
  {
    q: "What breeds do you carry?",
    a: "We currently specialize in Yorkies and Maltipoos — two of the most popular small breeds. We plan to add more breeds soon. Sign up for our contact list to be notified when new puppies are listed.",
  },
  {
    q: "Is there a health guarantee?",
    a: "Yes. All puppies come with a 30-day health guarantee. If within 30 days of purchase a licensed vet diagnoses a hereditary or congenital condition, we will work with you to make it right — including a replacement puppy or partial refund.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Zelle, Venmo, CashApp, and bank transfers. We do not currently accept credit cards but are working on adding that option soon.",
  },
  {
    q: "Can I meet the puppy before buying?",
    a: "If you are local, absolutely — we encourage it! For out-of-state buyers, we can arrange a live video call so you can meet your puppy face to face before committing.",
  },
  {
    q: "How are the puppies transported?",
    a: "We use professional, licensed pet transport services. Puppies travel in climate-controlled, comfortable carriers and are never put in cargo. We send you updates and photos during transit.",
  },
  {
    q: "What if I change my mind?",
    a: "We understand life happens. Deposits are non-refundable if you simply change your mind, but we will do our best to find your puppy a great home and may be able to apply your deposit to a different puppy.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            className={`faq-item${isOpen ? " pp-open" : ""}`}
            onClick={() => setOpenIndex(isOpen ? null : i)}
          >
            <div className="faq-q">
              <span>{item.q}</span>
              <span className="faq-icon">+</span>
            </div>
            {isOpen && <div className="faq-a">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
