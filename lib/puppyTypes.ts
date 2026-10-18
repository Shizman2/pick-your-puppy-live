export type PuppyGender = "male" | "female";
export type PuppySize = "teacup" | "toy" | "mini" | "standard";
// hold = temporarily held for a customer ("On Hold"). sale_pending = a customer
// has committed to buy, but payment/pickup/delivery isn't finished (migration 041).
export type PuppyStatus = "available" | "hold" | "sale_pending" | "sold" | "on_sale" | "discounted";
// Badge Tag is an optional marketing label only (NULL = none) - inventory
// state lives in Status. Matches puppies_badge_tag_check (migration 036).
export type PuppyBadgeTag = "new" | "popular" | "price_drop";
export type MarketingBadgeTag = PuppyBadgeTag;

export interface PuppyRow {
  id: string;
  name: string;
  slug: string;
  breed: string;
  price_cents: number;
  sale_price_cents: number | null;
  show_on_website: boolean;
  gender: PuppyGender;
  date_of_birth: string | null;
  size: PuppySize | null;
  status: PuppyStatus;
  badge_tag: PuppyBadgeTag | null;
  description: string | null;
  color: string | null;
  registration: string | null;
  microchip: string | null;
  photo_urls: string[];
  // Optional single Mom / Dad photos (migration 037) - never part of photo_urls.
  mother_photo_url?: string | null;
  father_photo_url?: string | null;
  // Puppy Spotlight / Special Opportunity (migration 038). Separate from
  // price_cents and sale_price_cents, which it never overwrites.
  is_spotlight?: boolean;
  spotlight_price_cents?: number | null;
  spotlight_headline?: string | null;
  spotlight_message?: string | null;
  vet_checked: boolean;
  vaccinated: boolean;
  delivery_available: boolean;
  is_featured: boolean;
  display_order: number;
  breeder_id: string | null;
  cost_cents: number;
  bundle_cost_cents: number;
  source_puppy_finder_option_id: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  sold_at?: string | null;
}

export const GENDER_OPTIONS: PuppyGender[] = ["male", "female"];
export const SIZE_OPTIONS: PuppySize[] = ["teacup", "toy", "mini", "standard"];
export const STATUS_OPTIONS: PuppyStatus[] = ["available", "hold", "sale_pending", "sold", "on_sale", "discounted"];
export const BADGE_OPTIONS: MarketingBadgeTag[] = ["new", "popular", "price_drop"];
export const BADGE_DISPLAY_LABEL: Record<MarketingBadgeTag, string> = {
  new: "New",
  popular: "Popular",
  price_drop: "Price Drop",
};

/** The marketing badge to show publicly, or null for none/unknown values. */
export function marketingBadge(tag: string | null | undefined): MarketingBadgeTag | null {
  return tag && tag in BADGE_DISPLAY_LABEL ? (tag as MarketingBadgeTag) : null;
}

/** A puppy counts as newly listed for this many days after its row was created. */
export const AUTO_NEW_DAYS = 7;

/**
 * Badge shown on cards and the detail page: the owner's chosen Badge Tag
 * always wins; with none chosen, a puppy whose listing was created in the
 * last AUTO_NEW_DAYS days shows "New". Based only on the real created_at
 * timestamp, so it never shows for older listings.
 */
export function displayBadgeTag(tag: string | null | undefined, createdAt: string | null | undefined): MarketingBadgeTag | null {
  const chosen = marketingBadge(tag);
  if (chosen) return chosen;
  if (!createdAt) return null;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= 0 && ageMs < AUTO_NEW_DAYS * 24 * 60 * 60 * 1000 ? "new" : null;
}
// Fixed states shown in the admin Location dropdown - "Other" (handled
// in the admin form itself, not stored as a literal value) lets a free-
// text location be saved without needing a matching option here.
export const PUPPY_LOCATION_OPTIONS: string[] = [
  "Delaware",
  "Maryland",
  "Pennsylvania",
  "New Jersey",
  "New York",
  "Connecticut",
];

export const STATUS_DISPLAY_LABEL: Record<PuppyStatus, string> = {
  available: "Available",
  hold: "On Hold",
  sale_pending: "Sale Pending",
  sold: "Sold",
  on_sale: "On Sale",
  discounted: "Discounted",
};

/** On Hold or Sale Pending: still listed, but never presented as available to buy now. */
export function isReservedStatus(status: string | null | undefined): boolean {
  return status === "hold" || status === "sale_pending";
}

export function formatPriceFromCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function slugify(name: string, breed: string): string {
  const base = `${name}-${breed}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "puppy";
}
