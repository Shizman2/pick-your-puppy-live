import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { FaqCategoryRow, FaqCategoryWithItems, FaqItemRow } from "./contentTypes";

/**
 * Single source of truth for FAQ content: categories with their items
 * nested inside, both already ordered by display_order. Used by both
 * the public FAQ page and the admin editor so the two never drift.
 */
export async function getFaqCategoriesWithItems(): Promise<FaqCategoryWithItems[]> {
  const admin = createAdminClient();

  const [{ data: categoriesData, error: categoriesError }, { data: itemsData, error: itemsError }] =
    await Promise.all([
      admin.from("faq_categories").select("*").order("display_order", { ascending: true }),
      admin.from("faq_items").select("*").order("display_order", { ascending: true }),
    ]);

  if (categoriesError) throw new Error(categoriesError.message);
  if (itemsError) throw new Error(itemsError.message);

  const categories = (categoriesData || []) as FaqCategoryRow[];
  const items = (itemsData || []) as FaqItemRow[];

  return categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.category_id === category.id),
  }));
}
