import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContentBlockRow, FaqCategoryWithItems, ContentPage } from "./contentTypes";
import { getFaqCategoriesWithItems } from "./faq";

export async function getContentBlocksForPage(page: ContentPage): Promise<ContentBlockRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_blocks")
    .select("*")
    .eq("page", page)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as ContentBlockRow[];
}

/**
 * The seller's phone number is a single global setting, not per-page
 * copy - it lives in the "settings" content_blocks bucket (reusing the
 * existing CMS mechanism) and is managed from the admin Settings page,
 * not the Website Editor. Returns null if it hasn't been configured
 * yet, so callers can hide the Call the Seller button instead of
 * rendering a broken tel: link.
 */
export async function getSellerPhoneNumber(): Promise<string | null> {
  try {
    const blocks = await getContentBlocksForPage("settings");
    const block = blocks.find((b) => b.section_key === "seller_phone_number");
    return block?.text_value?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * One reusable seller-signature value for the Puppy Documents system -
 * same "settings" content_blocks bucket as the phone number above, so
 * every document type (Bill of Sale, Health Guarantee, Refund Policy,
 * Puppy Purchase Acknowledgement, and any future one) renders the same
 * pre-filled signature instead of requiring a manual signature on every
 * printed copy. Resolved once per generated document and frozen into
 * its resolved_data at generation time - same treatment as business
 * phone/email - so a finalized document keeps whichever signature was
 * configured then. Falls back to "The Puppy Plugs" if never configured,
 * rather than leaving a document with a blank seller line.
 */
export async function getSellerSignatureName(): Promise<string> {
  try {
    const blocks = await getContentBlocksForPage("settings");
    const block = blocks.find((b) => b.section_key === "seller_signature_name");
    return block?.text_value?.trim() || "The Puppy Plugs";
  } catch {
    return "The Puppy Plugs";
  }
}

export interface RecentChange {
  id: string;
  label: string;
  page: ContentPage;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  label: string;
  page: ContentPage;
  imageUrl: string;
  updatedAt: string;
}

export interface WebsiteOverviewData {
  blocksByPage: Record<ContentPage, ContentBlockRow[]>;
  faqCategories: FaqCategoryWithItems[];
  recentChanges: RecentChange[];
  mediaItems: MediaItem[];
}

/**
 * Fetches everything the Website dashboard's overview needs in one
 * pass. Recent Changes and Media Library are both derived from real
 * data (actual updated_at timestamps, actual uploaded image_urls) -
 * nothing here is a placeholder list.
 */
export async function getWebsiteOverviewData(): Promise<WebsiteOverviewData> {
  const pages: ContentPage[] = ["homepage", "puppies", "contact", "faq", "footer", "puppy_finder"];

  const [blocksArrays, faqCategories] = await Promise.all([
    Promise.all(pages.map((p) => getContentBlocksForPage(p))),
    getFaqCategoriesWithItems(),
  ]);

  const blocksByPage = Object.fromEntries(pages.map((p, i) => [p, blocksArrays[i]])) as Record<
    ContentPage,
    ContentBlockRow[]
  >;

  const allBlocks = blocksArrays.flat();
  const allFaqItems = faqCategories.flatMap((c) => c.items);

  const recentChanges: RecentChange[] = [
    ...allBlocks.map((b) => ({ id: b.id, label: b.label, page: b.page, updatedAt: b.updated_at })),
    ...allFaqItems.map((f) => ({
      id: f.id,
      label: `FAQ: ${f.question}`,
      page: "faq" as ContentPage,
      updatedAt: f.updated_at,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const mediaItems: MediaItem[] = allBlocks
    .filter((b) => b.content_type === "image" && b.image_url)
    .map((b) => ({ id: b.id, label: b.label, page: b.page, imageUrl: b.image_url as string, updatedAt: b.updated_at }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return { blocksByPage, faqCategories, recentChanges, mediaItems };
}
