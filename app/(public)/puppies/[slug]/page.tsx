import { notFound } from "next/navigation";
import "./detail.css";
import "../../../../components/public-site/shareButtons.css";
import { getPuppyBySlug, isActiveSpotlight } from "../../../../lib/public-data/puppies";
import { getFavoriteCount } from "../../../../lib/favorites";
import { getBreedForPuppyBreedString } from "../../../../lib/breeds";
import { STATUS_DISPLAY_LABEL, BADGE_DISPLAY_LABEL, formatPriceFromCents, marketingBadge } from "../../../../lib/puppyTypes";
import FavoriteButton from "../../../../components/public/FavoriteButton";
import PuppyViewTracker from "../../../../components/public/PuppyViewTracker";
import PuppyFinderBanner from "../../../../components/public/PuppyFinderBanner";
import BreedProfileSection from "../../../../components/public/BreedProfileSection";
import PuppyGallery from "./PuppyGallery";
import TrackedLink from "../../../../components/public/TrackedLink";
import MeetTheParents from "./MeetTheParents";
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

// Same colors as the card badge in components/public-site/puppyCard.css.
const MARKETING_BADGE_COLOR: Record<string, string> = {
  new: "#1B7BFF",
  popular: "#DB2777",
  price_drop: "#DC2626",
};

export default async function PuppyDetailPage({ params }: { params: { slug: string } }) {
  const puppy = await getPuppyBySlug(params.slug);
  if (!puppy) notFound();

  const [favoritesCount, breedProfile] = await Promise.all([
    getFavoriteCount(puppy.id),
    getBreedForPuppyBreedString(puppy.breed),
  ]);

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
  // Sold puppies keep this URL and their info, but lose price, location and
  // every buy/contact action for this puppy (see the sold CTA below).
  const isSold = puppy.status === "sold";
  const badgeTag = isSold ? null : marketingBadge(puppy.badge_tag);
  // Active Special Opportunity: show its special price, not just the normal one.
  const specialPriceCents = isActiveSpotlight(puppy) ? (puppy.spotlight_price_cents as number) : null;

  return (
    <>
      <PuppyViewTracker puppyId={puppy.id} />
      <PlacementSlot pageType="puppy_detail" slot="global_below_header" pageIdentifier={puppy.id} />
      <PlacementPreviewOverlay pageType="puppy_detail" slot="global_below_header" pageIdentifier={puppy.id} />

      <a className="back-btn" href="/puppies">
        ← Back to Puppies
      </a>

      <PuppyGallery
        photos={puppy.photo_urls || []}
        alt={puppyName}
        location={isSold ? null : puppy.location}
        sold={isSold}
      />

      <div className="detail-info">
        <div className="detail-header">
          <div>
            <div className="detail-name">{puppyName}</div>
            <div className="detail-breed">{puppy.breed}</div>
          </div>
          {!isSold && specialPriceCents !== null && (
            <div className="detail-price detail-price--special">
              <span className="detail-price-was">{formatPriceFromCents(puppy.sale_price_cents || puppy.price_cents)}</span>
              <span className="detail-price-special">{formatPriceFromCents(specialPriceCents)}</span>
              <span className="detail-price-special-label">Special Price</span>
            </div>
          )}
          {!isSold && specialPriceCents === null && (
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
          )}
        </div>

        <div className="detail-favorite-row">
          <FavoriteButton puppyId={puppy.id} initialCount={favoritesCount} size="detail" />
          <span className="detail-favorite-label">favorited this puppy</span>
        </div>

        <div className="badge-row">
          {!isSold && (
            <span className="badge pp-status" style={{ background: statusColor }}>
              {statusLabel}
            </span>
          )}
          {badgeTag && (
            <span className="badge pp-status" style={{ background: MARKETING_BADGE_COLOR[badgeTag] }}>
              {BADGE_DISPLAY_LABEL[badgeTag]}
            </span>
          )}
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

      <BreedProfileSection breed={breedProfile} />

      <MeetTheParents motherUrl={puppy.mother_photo_url} fatherUrl={puppy.father_photo_url} />

      <PlacementSlot pageType="puppy_detail" slot="puppy_detail_above_reserve" pageIdentifier={puppy.id} />
      <PlacementPreviewOverlay pageType="puppy_detail" slot="puppy_detail_above_reserve" pageIdentifier={puppy.id} />

      {isSold ? (
        <div className="sold-detail-cta">
          <h2 className="sold-detail-cta-title">❤️ This Puppy Has Found Their Home</h2>
          <p className="sold-detail-cta-text">
            This puppy is no longer available, but we may have another puppy that&apos;s right for you.
          </p>
          <a className="sold-detail-cta-btn" href="/puppies">
            See Available Puppies
          </a>
        </div>
      ) : (
        <div className="detail-cta">
          {/* One contact CTA -> the puppy's contact page (call or message there). */}
          <TrackedLink className="want-puppy-btn" href={`/puppies/${puppy.slug}/contact`} ctaKey="im_interested" puppyId={puppy.id}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
              <path
                d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2 2z"
                fill="currentColor"
              />
            </svg>
            I Want This Puppy
            <span className="want-puppy-btn-chevron" aria-hidden="true">
              ›
            </span>
          </TrackedLink>
        </div>
      )}

      <ShareButtons
        heading="Share This Puppy"
        smsMessage={`Check out ${puppyName}`}
        shareText={`Check out ${puppyName}!`}
        shareTitle={puppyName}
      />

      <PlacementSlot pageType="puppy_detail" slot="puppy_detail_below_description" pageIdentifier={puppy.id} />
      <PlacementPreviewOverlay pageType="puppy_detail" slot="puppy_detail_below_description" pageIdentifier={puppy.id} />

      <BundleSection noteStyle="strip" />

      <PuppyFinderBanner puppyId={puppy.id} />
    </>
  );
}
