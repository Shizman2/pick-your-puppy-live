import { notFound } from "next/navigation";
import "../detail.css";
import "./contact.css";
import { getPuppyBySlug, getPuppyViewsLast24h } from "../../../../../lib/public-data/puppies";
import { getSellerPhoneNumber } from "../../../../../lib/content";
import PuppyContactPanel from "./PuppyContactPanel";

export const revalidate = 60;

// Same on-demand rendering as the puppy detail page.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const puppy = await getPuppyBySlug(params.slug);
  return {
    title: puppy ? `Contact Us About ${puppy.name || puppy.breed} – ThePuppyPlugs.com` : "ThePuppyPlugs.com",
    robots: { index: false },
  };
}

// The puppy's real last-updated time, in the business's (Eastern) time zone.
function formatUpdated(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  return `${date} at ${time}`;
}

function WhatToExpect({ puppyName, pronoun }: { puppyName: string; pronoun: string }) {
  const steps = [
    { title: `Confirm ${puppyName} is available`, text: `We'll let you know right away if ${pronoun}'s still available.` },
    { title: "Ask any questions you have", text: `Get the details you need about ${puppyName}.` },
    { title: "Choose pickup or delivery", text: "We'll go over the pickup or delivery options available to you." },
  ];
  return (
    <section className="contact-expect" aria-labelledby="what-to-expect">
      <h2 id="what-to-expect" className="contact-expect-title">
        What to Expect Next
      </h2>
      <ol className="contact-expect-list">
        {steps.map((s, i) => (
          <li key={s.title} className="contact-expect-step">
            <span className="contact-expect-num">{i + 1}</span>
            <div>
              <div className="contact-expect-step-title">{s.title}</div>
              <div className="contact-expect-step-text">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function PuppyContactPage({ params }: { params: { slug: string } }) {
  // getPuppyBySlug only returns show_on_website puppies, so a hidden puppy
  // 404s here exactly as on its detail page.
  const puppy = await getPuppyBySlug(params.slug);
  if (!puppy) notFound();

  const puppyName = puppy.name || puppy.breed;
  const listingHref = `/puppies/${puppy.slug}`;
  const backLink = (
    <a className="back-btn" href={listingHref}>
      ← Back to {puppyName}&rsquo;s Listing
    </a>
  );

  // Sold: never "Available", no call/message - same sold box as the detail page.
  if (puppy.status === "sold") {
    return (
      <>
        {backLink}
        <div className="sold-detail-cta">
          <h2 className="sold-detail-cta-title">❤️ This Puppy Has Found Their Home</h2>
          <p className="sold-detail-cta-text">
            This puppy is no longer available, but we may have another puppy that&apos;s right for you.
          </p>
          <a className="sold-detail-cta-btn" href="/puppies">
            See Available Puppies
          </a>
        </div>
      </>
    );
  }

  const [phone, views24h] = await Promise.all([getSellerPhoneNumber(), getPuppyViewsLast24h(puppy.id)]);
  const onHold = puppy.status === "hold";
  const coverUrl = (puppy.photo_urls || []).filter(Boolean)[0] || "";

  return (
    <>
      {backLink}

      <div className="contact-hero">
        <span className={`contact-status${onHold ? " contact-status--hold" : ""}`}>
          {onHold ? "Pending Adoption" : "Available Now"}
        </span>
        <h1 className="contact-title">{onHold ? `Ask About ${puppyName}` : `${puppyName} is Available!`}</h1>
        {puppy.updated_at && <p className="contact-updated">Last Updated: {formatUpdated(puppy.updated_at)}</p>}
      </div>

      {coverUrl && (
        <div className="contact-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={puppyName} />
        </div>
      )}

      <PuppyContactPanel
        puppyId={puppy.id}
        puppyName={puppyName}
        breed={puppy.breed}
        slug={puppy.slug}
        phone={phone}
        views24h={views24h}
      />

      <WhatToExpect puppyName={puppyName} pronoun={puppy.gender === "female" ? "she" : "he"} />
    </>
  );
}
