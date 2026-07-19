import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContentBlockRow, FaqItemRow, ContentPage } from "./contentTypes";

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

export async function getFaqItems(): Promise<FaqItemRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("faq_items")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as FaqItemRow[];
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
  faqItems: FaqItemRow[];
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
  const pages: ContentPage[] = ["homepage", "about", "puppies", "contact", "faq", "footer"];

  const [blocksArrays, faqItems] = await Promise.all([
    Promise.all(pages.map((p) => getContentBlocksForPage(p))),
    getFaqItems(),
  ]);

  const blocksByPage = Object.fromEntries(pages.map((p, i) => [p, blocksArrays[i]])) as Record<
    ContentPage,
    ContentBlockRow[]
  >;

  const allBlocks = blocksArrays.flat();

  const recentChanges: RecentChange[] = [
    ...allBlocks.map((b) => ({ id: b.id, label: b.label, page: b.page, updatedAt: b.updated_at })),
    ...faqItems.map((f) => ({
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

  return { blocksByPage, faqItems, recentChanges, mediaItems };
}
