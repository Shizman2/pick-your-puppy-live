import "server-only";
import { getAllVisiblePuppies, isActiveSpotlight } from "../public-data/puppies";
import { getBreedsListData } from "../breeds";
import { STATUS_DISPLAY_LABEL, formatPriceFromCents, type PuppyRow } from "../puppyTypes";
import type { AssistantContactPuppy, AssistantPuppyCard } from "./types";

// All puppy data the assistant sees or shows comes from here: the same
// show_on_website rows the public site uses. Nothing is ever taken from
// model output except the ids/filters it asks for.

function ageWeeks(row: PuppyRow): number | null {
  if (!row.date_of_birth) return null;
  const dob = new Date(`${row.date_of_birth}T00:00:00`);
  return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000)));
}

/** Current asking price + crossed-out price, the same order the detail page uses: Special Price > Sale > Price. Sold puppies show no price. */
function priceInfo(row: PuppyRow): { cents: number | null; wasCents: number | null } {
  if (row.status === "sold") return { cents: null, wasCents: null };
  if (isActiveSpotlight(row)) {
    return { cents: row.spotlight_price_cents as number, wasCents: row.sale_price_cents || row.price_cents };
  }
  if (row.sale_price_cents) return { cents: row.sale_price_cents, wasCents: row.price_cents };
  return { cents: row.price_cents, wasCents: null };
}

export function currentPriceCents(row: PuppyRow): number | null {
  return priceInfo(row).cents;
}

export function listingPath(row: PuppyRow) {
  return `/puppies/${row.slug}`;
}

export function toCard(row: PuppyRow): AssistantPuppyCard {
  const { cents, wasCents } = priceInfo(row);
  const photos = Array.isArray(row.photo_urls) ? row.photo_urls.filter(Boolean) : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name || row.breed,
    breed: row.breed,
    gender: row.gender,
    ageWeeks: ageWeeks(row),
    status: row.status,
    statusLabel: STATUS_DISPLAY_LABEL[row.status] || row.status,
    priceText: cents !== null ? formatPriceFromCents(cents) : null,
    wasPriceText: wasCents !== null ? formatPriceFromCents(wasCents) : null,
    photoUrl: photos[0] || "",
    location: row.status === "sold" ? null : row.location || null,
    url: listingPath(row),
  };
}

export function toContactPuppy(row: PuppyRow): AssistantContactPuppy {
  return { id: row.id, name: row.name || row.breed, breed: row.breed, gender: row.gender };
}

/** Compact summary the model reads. */
export function toModelSummary(row: PuppyRow) {
  const { cents, wasCents } = priceInfo(row);
  return {
    puppy_id: row.id,
    name: row.name || null,
    breed: row.breed,
    gender: row.gender,
    age_weeks: ageWeeks(row),
    size: row.size || null,
    status: STATUS_DISPLAY_LABEL[row.status] || row.status,
    price: cents !== null ? formatPriceFromCents(cents) : null,
    regular_price: wasCents !== null ? formatPriceFromCents(wasCents) : null,
    special_offer: isActiveSpotlight(row) ? row.spotlight_headline || "Special Price" : null,
    // Listing location badges are not a pickup location, so the model never sees them.
    listing_url: listingPath(row),
  };
}

export function toModelDetails(row: PuppyRow) {
  return {
    ...toModelSummary(row),
    date_of_birth: row.date_of_birth,
    color: row.color || null,
    registration: row.registration || null,
    description: row.description || null,
    vet_checked: row.vet_checked,
    vaccinated: row.vaccinated,
    delivery_available: row.delivery_available,
    special_offer_message: isActiveSpotlight(row) ? row.spotlight_message || null : null,
    photo_count: (row.photo_urls || []).filter(Boolean).length,
    has_parent_photos: !!(row.mother_photo_url || row.father_photo_url),
  };
}

/** Per-turn inventory snapshot: one query, reused by every tool call in the turn. */
export class InventorySnapshot {
  private rowsPromise: Promise<PuppyRow[]> | null = null;

  rows(): Promise<PuppyRow[]> {
    if (!this.rowsPromise) this.rowsPromise = getAllVisiblePuppies();
    return this.rowsPromise;
  }

  async byId(id: string): Promise<PuppyRow | null> {
    return (await this.rows()).find((r) => r.id === id) || null;
  }

  async byIdOrSlug(value: string): Promise<PuppyRow | null> {
    const v = value.trim().toLowerCase();
    const rows = await this.rows();
    return rows.find((r) => r.id === value.trim() || r.slug.toLowerCase() === v) || null;
  }
}

export async function findBreedProfile(breed: string) {
  const target = breed.trim().toLowerCase();
  if (!target) return null;
  const breeds = await getBreedsListData();
  return (
    breeds.find((b) => b.name.trim().toLowerCase() === target || (b.short_name || "").trim().toLowerCase() === target) ||
    breeds.find((b) => b.name.toLowerCase().includes(target) || target.includes(b.name.toLowerCase())) ||
    null
  );
}

export async function listBreedNames(): Promise<string[]> {
  const breeds = await getBreedsListData();
  return breeds.map((b) => b.name);
}
