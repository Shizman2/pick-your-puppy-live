import "./puppies.css";
import "../../../components/public-site/shareButtons.css";
import { getActivePuppiesForCards, getRecentlySoldPuppiesForCards } from "../../../lib/public-data/puppies";
import PuppyGrid from "./PuppyGrid";
import RecentlySoldSection from "../../../components/public-site/RecentlySoldSection";
import ShareButtons from "../../../components/public-site/ShareButtons";
import TrackedLink from "../../../components/public/TrackedLink";

export const revalidate = 60;

export const metadata = {
  title: "Available Puppies – ThePuppyPlugs.com",
};

export default async function PuppiesPage() {
  // Sold puppies never enter the active grid (or its search/filters/count);
  // they appear only in Recently Found Their Homes below it.
  const [puppies, soldPuppies] = await Promise.all([getActivePuppiesForCards(), getRecentlySoldPuppiesForCards()]);

  return (
    <>
      <div className="page-title">Available Puppies 🐾</div>
      <div className="page-sub">All puppies are vet-checked, vaccinated, and ready for their forever home.</div>
      <PuppyGrid puppies={puppies} />
      <RecentlySoldSection puppies={soldPuppies} />
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
