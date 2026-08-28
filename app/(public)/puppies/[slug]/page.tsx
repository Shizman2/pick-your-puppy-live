import { notFound } from "next/navigation";
import "./detail.css";
import "../../../../components/public-site/shareButtons.css";
import { getPuppyBySlug } from "../../../../lib/public-data/puppies";
import { getSellerPhoneNumber } from "../../../../lib/content";
import { STATUS_DISPLAY_LABEL, formatPriceFromCents } from "../../../../lib/puppyTypes";
import PuppyGallery from "./PuppyGallery";
import PuppyQuestionForm from "./PuppyQuestionForm";
import CallSellerButton from "./CallSellerButton";
import ShareButtons from "../../../../components/public-site/ShareButtons";
import BundleSection from "../../../../components/public-site/BundleSection";
import PlacementSlot from "../../../../components/public-site/PlacementSlot";
import PlacementPreviewOverlay from "../../../../components/public-site/PlacementPreviewOverlay";

export const revalidate = 60;

// No paths are known at build time; dynamicParams (default true) lets
// Next.js render + cache each slug on-demand on its first real visit,
// rather than falling back to full per-request SSR.
export async function generateStaticParams() {
  return [];
}

const STATUS_COLOR: Record<string, string> = {
  available: "#22C55E",
  hold: "#F59E0B",
  sold: "#EF4444",
  on_sale: "#F97316",
  discounted: "#A855F7",
};

export default async function PuppyDetailPage({ params }: { params: { slug: string } }) {
  const [puppy, sellerPhone] = await Promise.all([getPuppyBySlug(params.slug), getSellerPhoneNumber()]);
  if (!puppy) notFound();

  let ageDisplay = "—";
  let dobDisplay = "—";
  if (puppy.date_of_birth) {
    const dob = new Date(`${puppy.date_of_birth}T00:00:00`);
    const ageWeeks = Math.max(0, Math.floor((Date.now() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    ageDisplay = `${ageWeeks} ${ageWeeks === 1 ? "week" : "weeks"}`;
    dobDisplay = dob.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  const statusLabel = STATUS_DISPLAY_LABEL[puppy.status];
  const statusColor = STATUS_COLOR[puppy.status] || STATUS_COLOR.available;
  const puppyName = puppy.name || puppy.breed;

  return (
    <>
      <PlacementSlot pageType="puppy_detail" slot="global_below_header" pageIdentifier={puppy.id} />
      <PlacementPreviewOverlay pageType="puppy_detail" slot="global_below_header" pageIdentifier={puppy.id} />

      <a className="back-btn" href="/puppies">
        ← Back to Puppies
      </a>

      <PuppyGallery photos={puppy.photo_urls || []} alt={puppyName} />

      <div className="detail-info">
        <div className="detail-header">
          <div>
            <div className="detail-name">{puppyName}</div>
            <div className="detail-breed">{puppy.breed}</div>
          </div>
          <div className="detail-price">
            {puppy.sale_price_cents ? (
              <>
                <span style={{ textDecoration: "line-through", color: "#9CA3AF", fontWeight: 700, fontSize: 15, marginRight: 6 }}>
                  {formatPriceFromCents(puppy.price_cents)}
                </span>
                {formatPriceFromCents(puppy.sale_price_cents)}
              </>
            ) : (
              formatPriceFromCents(puppy.price_cents)
            )}
          </div>
        </div>

        <div className="badge-row">
          <span className="badge pp-status" style={{ background: statusColor }}>
            {statusLabel}
          </span>
          {puppy.vet_checked && <span className="badge">✅ Vet Checked</span>}
          {puppy.vaccinated && <span className="badge">💉 Vaccinated</span>}
          {puppy.delivery_available && <span className="badge">🚚 Delivery Available</span>}
        </div>

        <div className="quick-info-grid">
          <div className="qi-box">
            <div className="qi-label">Gender</div>
            <div className="qi-val">{puppy.gender === "male" ? "♂ Male" : "♀ Female"}</div>
          </div>
          <div className="qi-box">
            <div className="qi-label">Age</div>
            <div className="qi-val">{ageDisplay}</div>
          </div>
          <div className="qi-box">
            <div className="qi-label">DOB</div>
            <div className="qi-val">{dobDisplay}</div>
          </div>
          <div className="qi-box">
            <div className="qi-label">Size</div>
            <div className="qi-val">{puppy.size || "—"}</div>
          </div>
        </div>

        {puppy.description && (
          <>
            <div className="about-title">About {puppyName}</div>
            <p className="detail-desc">{puppy.description}</p>
          </>
        )}
      </div>

      <PlacementSlot pageType="puppy_detail" slot="puppy_detail_above_reserve" pageIdentifier={puppy.id} />
      <PlacementPreviewOverlay pageType="puppy_detail" slot="puppy_detail_above_reserve" pageIdentifier={puppy.id} />

      <div className="detail-cta">
        <CallSellerButton phone={sellerPhone} />

        <PuppyQuestionForm puppyId={puppy.id} puppyName={puppyName} breed={puppy.breed} slug={puppy.slug} />

        {puppy.status === "sold" ? (
          <button className="pp-btn-primary" disabled style={{ opacity: 0.5, cursor: "default" }}>
            This Puppy Has Been Sold
          </button>
        ) : puppy.status === "hold" ? (
          <button className="pp-btn-primary" disabled style={{ opacity: 0.5, cursor: "default" }}>
            Pending Adoption
          </button>
        ) : (
          <a className="pp-btn-primary" href={`/puppies/${puppy.slug}/reserve`}>
            Reserve This Puppy ›
          </a>
        )}
      </div>

      <ShareButtons
        heading="Share This Puppy"
        smsMessage={`Check out ${puppyName}`}
        shareText={`Check out ${puppyName}!`}
        shareTitle={puppyName}
      />

      <PlacementSlot pageType="puppy_detail" slot="puppy_detail_below_description" pageIdentifier={puppy.id} />
      <PlacementPreviewOverlay pageType="puppy_detail" slot="puppy_detail_below_description" pageIdentifier={puppy.id} />

      <BundleSection />
    </>
  );
}
