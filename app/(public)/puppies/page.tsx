import "./puppies.css";
import "../../../components/public-site/shareButtons.css";
import { getAllVisiblePuppiesForCards } from "../../../lib/public-data/puppies";
import PuppyGrid from "./PuppyGrid";
import ShareButtons from "../../../components/public-site/ShareButtons";
import TrackedLink from "../../../components/public/TrackedLink";

export const revalidate = 60;

export const metadata = {
  title: "Available Puppies – ThePuppyPlugs.com",
};

export default async function PuppiesPage() {
  const puppies = await getAllVisiblePuppiesForCards();

  return (
    <>
      <div className="page-title">Available Puppies 🐾</div>
      <div className="page-sub">All puppies are vet-checked, vaccinated, and ready for their forever home.</div>
      <PuppyGrid puppies={puppies} />
      <TrackedLink
        href="/puppy-finder"
        className="finder-banner-link"
        aria-label="Use Our Puppy Finder Service"
        ctaKey="puppy_finder"
      >
        <img src="/puppyfinderbanner.png" alt="Use Our Puppy Finder Service" className="finder-banner-img" />
      </TrackedLink>
      <ShareButtons
        heading="Share This Page"
        smsMessage="Check out these puppies"
        shareText="Check out these puppies!"
        shareTitle="Available Puppies – ThePuppyPlugs.com"
      />
    </>
  );
}
