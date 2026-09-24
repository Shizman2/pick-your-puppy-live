import "./puppies.css";
import "../../../components/public-site/shareButtons.css";
import { getAllVisiblePuppiesForCards } from "../../../lib/public-data/puppies";
import PuppyGrid from "./PuppyGrid";
import ShareButtons from "../../../components/public-site/ShareButtons";

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
      <a href="/puppy-finder" className="finder-banner-link" aria-label="Use Our Puppy Finder Service">
        <img src="/puppyfinderbanner.png" alt="Use Our Puppy Finder Service" className="finder-banner-img" />
      </a>
      <ShareButtons
        heading="Share This Page"
        smsMessage="Check out these puppies"
        shareText="Check out these puppies!"
        shareTitle="Available Puppies – ThePuppyPlugs.com"
      />
    </>
  );
}
