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
