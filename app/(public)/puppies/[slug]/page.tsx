import { notFound } from "next/navigation";
import "./detail.css";
import "../../../../components/public-site/shareButtons.css";
import { getPuppyBySlug, getPuppyViewCount, isActiveSpotlight } from "../../../../lib/public-data/puppies";
import { getFavoriteCount } from "../../../../lib/favorites";
import { getBreedForPuppyBreedString } from "../../../../lib/breeds";
import { getSellerPhoneNumber } from "../../../../lib/content";
import { STATUS_DISPLAY_LABEL, BADGE_DISPLAY_LABEL, formatPriceFromCents, displayBadgeTag } from "../../../../lib/puppyTypes";
import FavoriteButton from "../../../../components/public/FavoriteButton";
import PuppyViewTracker from "../../../../components/public/PuppyViewTracker";
import PuppyFinderBanner from "../../../../components/public/PuppyFinderBanner";
import BreedProfileSection from "../../../../components/public/BreedProfileSection";
import PuppyGallery from "./PuppyGallery";
import MeetTheParents from "./MeetTheParents";
import PuppyContactButtons from "./PuppyContactButtons";
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
  sale_pending: "#0D9488",
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

  const [favoritesCount, breedProfile, sellerPhone, viewCount] = await Promise.all([
    getFavoriteCount(puppy.id),
    getBreedForPuppyBreedString(puppy.breed),
    // Sold puppies show no contact buttons, so skip the lookup.
    puppy.status === "sold" ? Promise.resolve(null) : getSellerPhoneNumber(),
    getPuppyViewCount(puppy.id),
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
  const badgeTag = isSold ? null : displayBadgeTag(puppy.badge_tag, puppy.created_at);
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

        {/* Views (real analytics: one per visitor per 30 min, hidden until there is one) and favorites (tap the heart to save). */}
        <div className={`detail-stats${viewCount > 0 ? "" : " detail-stats--single"}`}>
          {viewCount > 0 && (
            <>
              <div className="detail-stat">
                <span className="detail-stat-icon detail-stat-icon--views">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                    <path
                      d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <span className="detail-stat-text">
                  <span className="detail-stat-value">
                    {viewCount.toLocaleString("en-US")} {viewCount === 1 ? "view" : "views"}
                  </span>
                  <span className="detail-stat-label">Listing views</span>
                </span>
              </div>
              <span className="detail-stats-divider" aria-hidden="true" />
            </>
          )}
          <FavoriteButton puppyId={puppy.id} initialCount={favoritesCount} size="stat" />
        </div>

        {/* Text (primary) + Call - straight to the device, no contact page. */}
        {!isSold && (
          <PuppyContactButtons
            puppyId={puppy.id}
            name={puppy.name}
            breed={puppy.breed}
            gender={puppy.gender}
            phone={sellerPhone}
          />
        )}

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

      {isSold && (
        <div className="sold-detail-cta">
          <h2 className="sold-detail-cta-title">❤️ This Puppy Has Found Their Home</h2>
          <p className="sold-detail-cta-text">
            This puppy is no longer available, but we may have another puppy that&apos;s right for you.
          </p>
          <a className="sold-detail-cta-btn" href="/puppies">
            See Available Puppies
          </a>
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
