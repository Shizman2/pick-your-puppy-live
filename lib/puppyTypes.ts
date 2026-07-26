export type PuppyGender = "male" | "female";
export type PuppySize = "teacup" | "toy" | "mini" | "standard";
export type PuppyStatus = "available" | "hold" | "sold" | "on_sale" | "discounted";
export type PuppyBadgeTag = "available" | "new" | "popular";

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
  photo_urls: string[];
  vet_checked: boolean;
  vaccinated: boolean;
  delivery_available: boolean;
  is_featured: boolean;
  display_order: number;
  breeder_id: string | null;
  cost_cents: number;
  bundle_cost_cents: number;
  created_at: string;
  updated_at: string;
}

export const GENDER_OPTIONS: PuppyGender[] = ["male", "female"];
export const SIZE_OPTIONS: PuppySize[] = ["teacup", "toy", "mini", "standard"];
export const STATUS_OPTIONS: PuppyStatus[] = ["available", "hold", "sold", "on_sale", "discounted"];
export const BADGE_OPTIONS: PuppyBadgeTag[] = ["available", "new", "popular"];

export const STATUS_DISPLAY_LABEL: Record<PuppyStatus, string> = {
  available: "Available",
  hold: "Pending Adoption",
  sold: "Sold",
  on_sale: "On Sale",
  discounted: "Discounted",
};

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
