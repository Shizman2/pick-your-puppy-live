"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { ContentPage, ContentType } from "../../../lib/contentTypes";

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
  return { success: true };
}

export async function updateContentBlockText(id: string, textValue: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("content_blocks").update({ text_value: textValue }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  return { success: true };
}

export async function deleteContentBlock(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("content_blocks").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  return { success: true };
}

export async function uploadContentImage(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };

  const admin = createAdminClient();
  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `content/${id}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await admin.storage.from("site-content").upload(filePath, file, {
    upsert: true,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("site-content").getPublicUrl(filePath);

  const { error } = await admin.from("content_blocks").update({ image_url: publicUrl }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  return { success: true };
}

export async function createFaqItem(question: string, answer: string, displayOrder: number): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!question.trim() || !answer.trim()) {
    return { success: false, error: "Question and answer are required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("faq_items").insert({
    question: question.trim(),
    answer: answer.trim(),
    display_order: displayOrder,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  return { success: true };
}

export async function updateFaqItem(id: string, question: string, answer: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("faq_items")
    .update({ question: question.trim(), answer: answer.trim() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  return { success: true };
}

export async function deleteFaqItem(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("faq_items").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/website");
  return { success: true };
}
