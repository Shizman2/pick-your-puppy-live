"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { ContentPage, ContentType } from "../../../lib/contentTypes";
import { resizeImageForWeb } from "../../../lib/imageProcessing";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export async function createContentBlock(fields: {
  page: ContentPage;
  sectionKey: string;
  label: string;
  contentType: ContentType;
  textValue: string;
  displayOrder: number;
}): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.sectionKey.trim() || !fields.label.trim()) {
    return { success: false, error: "Section key and label are required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("content_blocks").insert({
    page: fields.page,
    section_key: fields.sectionKey.trim(),
    label: fields.label.trim(),
    content_type: fields.contentType,
    text_value: fields.contentType === "text" ? fields.textValue : null,
    display_order: fields.displayOrder,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateContentBlockText(id: string, textValue: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("content_blocks").update({ text_value: textValue }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteContentBlock(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("content_blocks").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadContentImage(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };

  const admin = createAdminClient();

  let processedBuffer: Buffer;
  let contentType: string;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const result = await resizeImageForWeb(inputBuffer, 2000);
    processedBuffer = result.buffer;
    contentType = result.contentType;
  } catch (err) {
    return { success: false, error: err instanceof Error ? `Image processing failed: ${err.message}` : "Image processing failed." };
  }

  const filePath = `content/${id}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await admin.storage.from("site-content").upload(filePath, processedBuffer, {
    upsert: true,
    contentType,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("site-content").getPublicUrl(filePath);

  const { error } = await admin.from("content_blocks").update({ image_url: publicUrl }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function createFaqCategory(title: string, icon: string | null, displayOrder: number): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!title.trim()) {
    return { success: false, error: "Section title is required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("faq_categories").insert({
    title: title.trim(),
    icon,
    display_order: displayOrder,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function updateFaqCategory(id: string, title: string, icon: string | null): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!title.trim()) {
    return { success: false, error: "Section title is required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("faq_categories").update({ title: title.trim(), icon }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function deleteFaqCategory(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { count } = await admin.from("faq_items").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count && count > 0) {
    return { success: false, error: "Delete or move every question out of this section first." };
  }

  const { error } = await admin.from("faq_categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function moveFaqCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { data: categories, error } = await admin
    .from("faq_categories")
    .select("id, display_order")
    .order("display_order", { ascending: true });
  if (error) return { success: false, error: error.message };

  const list = categories || [];
  const idx = list.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return { success: true };

  const current = list[idx];
  const swap = list[swapIdx];
  await admin.from("faq_categories").update({ display_order: swap.display_order }).eq("id", current.id);
  await admin.from("faq_categories").update({ display_order: current.display_order }).eq("id", swap.id);

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function createFaqItem(
  categoryId: string,
  question: string,
  answer: string,
  displayOrder: number
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!question.trim() || !answer.trim()) {
    return { success: false, error: "Question and answer are required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("faq_items").insert({
    category_id: categoryId,
    question: question.trim(),
    answer: answer.trim(),
    display_order: displayOrder,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function updateFaqItem(
  id: string,
  question: string,
  answer: string,
  categoryId: string
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("faq_items")
    .update({ question: question.trim(), answer: answer.trim(), category_id: categoryId })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function toggleFaqItemVisibility(id: string, isVisible: boolean): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("faq_items").update({ is_visible: isVisible }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function deleteFaqItem(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("faq_items").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}

export async function moveFaqItem(id: string, categoryId: string, direction: "up" | "down"): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { data: items, error } = await admin
    .from("faq_items")
    .select("id, display_order")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true });
  if (error) return { success: false, error: error.message };

  const list = items || [];
  const idx = list.findIndex((i) => i.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return { success: true };

  const current = list[idx];
  const swap = list[swapIdx];
  await admin.from("faq_items").update({ display_order: swap.display_order }).eq("id", current.id);
  await admin.from("faq_items").update({ display_order: current.display_order }).eq("id", swap.id);

  revalidatePath("/admin/website");
  revalidatePath("/faq");
  return { success: true };
}
