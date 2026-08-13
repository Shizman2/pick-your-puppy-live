import { notFound } from "next/navigation";
import "./reserve.css";
import { getPuppyBySlug } from "../../../../../lib/public-data/puppies";
import { STATUS_DISPLAY_LABEL } from "../../../../../lib/puppyTypes";
import ReservationForm from "./ReservationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reserve Your Puppy – ThePuppyPlugs.com",
};

export default async function ReservePage({ params }: { params: { slug: string } }) {
  const puppy = await getPuppyBySlug(params.slug);
  if (!puppy) notFound();

  const puppyName = puppy.name || puppy.breed;

  if (puppy.status !== "available" && puppy.status !== "on_sale" && puppy.status !== "discounted") {
    return (
      <div className="reserve-unavailable">
        <h1>{puppyName} isn&rsquo;t available to reserve right now</h1>
        <p>Current status: {STATUS_DISPLAY_LABEL[puppy.status]}</p>
        <a className="pp-btn-primary" href={`/puppies/${puppy.slug}`}>
          Back to {puppyName}&rsquo;s Page
        </a>
      </div>
    );
  }

  return (
    <div className="reserve-page">
      <a className="back-btn" href={`/puppies/${puppy.slug}`}>
        ← Back to {puppyName}
      </a>
      <div className="reserve-header">
        <h1>Reserve {puppyName}</h1>
        <p>Let us know you&rsquo;re interested — we&rsquo;ll reach out to arrange the next steps.</p>
      </div>
      <ReservationForm puppyId={puppy.id} puppyName={puppyName} slug={puppy.slug} />
    </div>
  );
}
