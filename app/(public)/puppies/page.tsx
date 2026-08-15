import "./puppies.css";
import { getAllVisiblePuppiesForCards } from "../../../lib/public-data/puppies";
import PuppyGrid from "./PuppyGrid";

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
    </>
  );
}
