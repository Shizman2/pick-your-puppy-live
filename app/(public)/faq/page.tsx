import "./faq.css";
import FaqAccordion, { type FaqCategoryEntry } from "./FaqAccordion";
import { getFaqCategoriesWithItems } from "../../../lib/faq";

export const metadata = {
  title: "FAQ – ThePuppyPlugs.com",
};

// Fallback only - used if faq_categories/faq_items haven't been seeded
// yet in Supabase, so the page never ships blank. Once real rows exist,
// these are never shown.
const FALLBACK_CATEGORIES: FaqCategoryEntry[] = [
  {
    id: "fallback-getting",
    title: "Getting Your Puppy",
    icon: "paw",
    items: [
      {
        id: "fallback-1",
        q: "How do I reserve a puppy?",
        a: 'Simply click "Reserve This Puppy" on any puppy detail page and fill out the short form. We will contact you within 24 hours to confirm availability and walk you through the next steps. A small deposit holds your puppy.',
      },
      {
        id: "fallback-2",
        q: "What if I don't see the puppy I want?",
        a: "Use our Puppy Finder service - tell us the breed, size, and features you're looking for, and we'll notify you as soon as a matching puppy becomes available.",
      },
      {
        id: "fallback-3",
        q: "What breeds do you carry?",
        a: "We currently specialize in Yorkies and Maltipoos — two of the most popular small breeds. We plan to add more breeds soon. Sign up for our contact list to be notified when new puppies are listed.",
      },
    ],
  },
  {
    id: "fallback-payments",
    title: "Payments & Pricing",
    icon: "tag",
    items: [
      {
        id: "fallback-4",
        q: "Do I need a deposit to reserve a puppy?",
        a: "We require a $200 deposit to hold your puppy. This deposit is applied toward your total purchase price. Deposits are refundable if the puppy has a vet-confirmed health issue.",
      },
      {
        id: "fallback-5",
        q: "What payment methods do you accept?",
        a: "We accept Zelle, Venmo, CashApp, and bank transfers. We do not currently accept credit cards but are working on adding that option soon.",
      },
    ],
  },
  {
    id: "fallback-health",
    title: "Health & Care",
    icon: "shield-check",
    items: [
      {
        id: "fallback-6",
        q: "Are the puppies vet checked?",
        a: "Absolutely. Every single puppy on our site has been examined by a licensed veterinarian, is up to date on age-appropriate vaccines, has been dewormed, and comes with a full health record.",
      },
      {
        id: "fallback-7",
        q: "Is there a health guarantee?",
        a: "Yes. All puppies come with a 30-day health guarantee. If within 30 days of purchase a licensed vet diagnoses a hereditary or congenital condition, we will work with you to make it right — including a replacement puppy or partial refund.",
      },
    ],
  },
  {
    id: "fallback-pickup",
    title: "Pickup & Delivery",
    icon: "truck",
    items: [
      {
        id: "fallback-8",
        q: "Do you offer delivery?",
        a: "Yes! We offer safe, professional pet transport delivery to your door anywhere in the United States. Delivery fees vary by location and will be quoted when you reserve. We can also arrange local pickup.",
      },
      {
        id: "fallback-9",
        q: "Can I meet the puppy before buying?",
        a: "If you are local, absolutely — we encourage it! For out-of-state buyers, we can arrange a live video call so you can meet your puppy face to face before committing.",
      },
    ],
  },
];

export default async function FaqPage() {
  let categories: FaqCategoryEntry[] = FALLBACK_CATEGORIES;
  try {
    const rows = await getFaqCategoriesWithItems();
    const visible = rows
      .map((c) => ({
        id: c.id,
        title: c.title,
        icon: c.icon,
        items: c.items.filter((i) => i.is_visible).map((i) => ({ id: i.id, q: i.question, a: i.answer })),
      }))
      .filter((c) => c.items.length > 0);
    if (visible.length > 0) {
      categories = visible;
    }
  } catch {
    // Supabase error - keep the fallback content rather than showing a broken page.
  }

  return (
    <>
      <div className="faq-hero">
        <div className="icon">❓</div>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about finding, reserving, and bringing home your puppy.</p>
      </div>

      <FaqAccordion categories={categories} />

      <div className="faq-still">
        <div className="faq-still-icon">🎧</div>
        <div className="faq-still-text">
          <h3>Still have a question?</h3>
          <p>We're happy to help.</p>
        </div>
        <a className="pp-btn-primary faq-still-btn" href="/contact">
          Contact Us
        </a>
      </div>
    </>
  );
}
