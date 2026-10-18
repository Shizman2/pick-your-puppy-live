import "./faq.css";
import FaqAccordion, { type FaqCategoryEntry } from "./FaqAccordion";
import { getFaqCategoriesWithItems } from "../../../lib/faq";

export const metadata = {
  title: "FAQ – ThePuppyPlugs.com",
};

// Fallback only - used if faq_categories/faq_items haven't been seeded
// yet in Supabase, so the page never ships blank. Once real rows exist,
// these are never shown. Keep in step with the approved FAQ answers
// (docs/bently/faq-corrections.json).
const FALLBACK_CATEGORIES: FaqCategoryEntry[] = [
  {
    id: "fallback-getting",
    title: "Getting Your Puppy",
    icon: "paw",
    items: [
      {
        id: "fallback-1",
        q: "How do I reserve a puppy?",
        a: "Text or call our team using the Text or Call button on the puppy's page. Our team will confirm availability and walk you through the next steps. No deposit is required if you're picking up an available puppy (pay in full with cash at pickup) or getting local delivery (pay in cash upon delivery). A deposit is only required for out-of-state delivery or Puppy Finder, and our team will confirm the amount and payment instructions.",
      },
      {
        id: "fallback-2",
        q: "What if I don't see the puppy I want?",
        a: "Use our Puppy Finder service, which is included with no additional fee. Fill out the form at thepuppyplugs.com/puppy-finder with the breed, gender, and preferences you want. We search for puppies that match and send you 3 to 4 options to review. You choose one and reserve it with a deposit through Cash App, we pick up your puppy, and you choose local pickup or delivery.",
      },
      {
        id: "fallback-3",
        q: "What breeds do you carry?",
        a: "Our available breeds change as new puppies are listed. See all current puppies on our Puppies page. If you don't see the breed you want, our Puppy Finder service can help you find one.",
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
        q: "How much is the deposit?",
        a: "It depends on your situation. No deposit is required to pick up an available puppy. You can pay in full with cash at pickup. Local delivery (less than one hour away) also needs no deposit, and you pay in cash upon delivery. A deposit is required for out-of-state delivery, and for Puppy Finder after you choose your puppy. Our team will confirm the amount and payment instructions. Deposits are paid through Cash App.",
      },
      {
        id: "fallback-5",
        q: "What payment methods do you accept?",
        a: "We accept cash for puppy purchases, including payment in full at pickup or upon local delivery. When a deposit is required, we accept Cash App. Our team will confirm the amount and payment instructions.",
      },
      {
        id: "fallback-6",
        q: "What if I change my mind?",
        a: "We understand life happens. Deposits are non-refundable if you change your mind. In some cases, our team may be able to transfer your deposit to a different puppy. This is decided case by case and isn't guaranteed.",
      },
    ],
  },
  {
    id: "fallback-health",
    title: "Health & Care",
    icon: "shield-check",
    items: [
      {
        id: "fallback-7",
        q: "Are the puppies vet checked?",
        a: "Yes. Every puppy, including Puppy Finder puppies, receives a veterinary check, vaccinations, and deworming, and comes with health and shot records. Ask our team for any specific puppy's records.",
      },
      {
        id: "fallback-8",
        q: "Is there a health guarantee?",
        a: "Yes. Every puppy comes with our written Health Guarantee. Have your puppy examined by a licensed veterinarian within 10 days of purchase. If within 10 days a vet determines in writing that your puppy is clinically ill, or within 30 days that it has a congenital or hereditary defect affecting its health, you may return the puppy for a full refund, return it for a replacement puppy of equal value, or keep it and be reimbursed for reasonable vet fees up to the purchase price. You must notify us within 2 business days of the vet's written certification. Full terms, conditions and exclusions are in the Health Guarantee you receive at purchase.",
      },
    ],
  },
  {
    id: "fallback-pickup",
    title: "Pickup & Delivery",
    icon: "truck",
    items: [
      {
        id: "fallback-9",
        q: "Do you offer delivery?",
        a: "Yes. Pickup is free. Local delivery is $50 for destinations less than one hour away, with no deposit. You pay in cash upon delivery, and our team confirms whether your address qualifies. For out-of-state delivery beyond the local area, a deposit is required and our team will confirm the amount and payment instructions. We offer ground delivery to Delaware, Maryland, Pennsylvania, New Jersey, New York, and Connecticut, and flight nanny arrangements may be available for other states.",
      },
      {
        id: "fallback-10",
        q: "Can I meet the puppy before buying?",
        a: "Yes. Our team can arrange a video call so you can see your puppy before buying. Text or call our team to schedule it.",
      },
      {
        id: "fallback-11",
        q: "How are the puppies transported?",
        a: "Puppies going to Delaware, Maryland, Pennsylvania, New Jersey, New York, or Connecticut travel by ground delivery. For other states, a flight nanny may be available. Our team can help arrange that and will coordinate the details and schedule with you.",
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
