import "./faq.css";
import FaqAccordion, { type FaqEntry } from "./FaqAccordion";
import { getFaqItems } from "../../../lib/content";


export const metadata = {
  title: "FAQ – ThePuppyPlugs.com",
};

// Fallback only - used if the faq_items table hasn't been seeded yet in
// Supabase, so the page never ships blank. Once real rows exist, these
// are never shown.
const FALLBACK_FAQS: FaqEntry[] = [
  {
    id: "fallback-1",
    q: "How do I reserve a puppy?",
    a: 'Simply click "Reserve This Puppy" on any puppy detail page and fill out the short form. We will contact you within 24 hours to confirm availability and walk you through the next steps. A small deposit holds your puppy.',
  },
  {
    id: "fallback-2",
    q: "How much is the deposit?",
    a: "We require a $200 deposit to hold your puppy. This deposit is applied toward your total purchase price. Deposits are refundable if the puppy has a vet-confirmed health issue.",
  },
  {
    id: "fallback-3",
    q: "Do you offer delivery?",
    a: "Yes! We offer safe, professional pet transport delivery to your door anywhere in the United States. Delivery fees vary by location and will be quoted when you reserve. We can also arrange local pickup.",
  },
  {
    id: "fallback-4",
    q: "Are the puppies vet checked?",
    a: "Absolutely. Every single puppy on our site has been examined by a licensed veterinarian, is up to date on age-appropriate vaccines, has been dewormed, and comes with a full health record.",
  },
  {
    id: "fallback-5",
    q: "What breeds do you carry?",
    a: "We currently specialize in Yorkies and Maltipoos — two of the most popular small breeds. We plan to add more breeds soon. Sign up for our contact list to be notified when new puppies are listed.",
  },
  {
    id: "fallback-6",
    q: "Is there a health guarantee?",
    a: "Yes. All puppies come with a 30-day health guarantee. If within 30 days of purchase a licensed vet diagnoses a hereditary or congenital condition, we will work with you to make it right — including a replacement puppy or partial refund.",
  },
  {
    id: "fallback-7",
    q: "What payment methods do you accept?",
    a: "We accept Zelle, Venmo, CashApp, and bank transfers. We do not currently accept credit cards but are working on adding that option soon.",
  },
  {
    id: "fallback-8",
    q: "Can I meet the puppy before buying?",
    a: "If you are local, absolutely — we encourage it! For out-of-state buyers, we can arrange a live video call so you can meet your puppy face to face before committing.",
  },
  {
    id: "fallback-9",
    q: "How are the puppies transported?",
    a: "We use professional, licensed pet transport services. Puppies travel in climate-controlled, comfortable carriers and are never put in cargo. We send you updates and photos during transit.",
  },
  {
    id: "fallback-10",
    q: "What if I change my mind?",
    a: "We understand life happens. Deposits are non-refundable if you simply change your mind, but we will do our best to find your puppy a great home and may be able to apply your deposit to a different puppy.",
  },
];

export default async function FaqPage() {
  let faqs: FaqEntry[] = FALLBACK_FAQS;
  try {
    const rows = await getFaqItems();
    if (rows.length > 0) {
      faqs = rows.map((r) => ({ id: r.id, q: r.question, a: r.answer }));
    }
  } catch {
    // Supabase error - keep the fallback content rather than showing a broken page.
  }

  return (
    <>
      <div className="faq-hero">
        <div className="icon">❓</div>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know before bringing your puppy home.</p>
      </div>

      <FaqAccordion faqs={faqs} />

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
