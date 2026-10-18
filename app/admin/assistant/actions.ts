"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdminUser } from "../../../lib/authz";
import { ASSISTANT_MODELS, type AssistantEffort, type AssistantMode } from "../../../lib/assistant/config";

export type ActionResult = { success: true } | { success: false; error: string };

export interface AssistantSettingsInput {
  mode: AssistantMode;
  model: string;
  effort: AssistantEffort;
  dailyBudgetUsd: number;
  maxMessagesPerConversation: number;
  maxMessagesPerHour: number;
  maxNewChatsPerIpPerDay: number;
  retentionDays: number;
  greeting: string;
  businessInfo: string;
  salesInstructions: string;
}

function intInRange(value: number, min: number, max: number) {
  return Number.isInteger(value) && value >= min && value <= max;
}

export async function updateAssistantSettings(input: AssistantSettingsInput): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!["off", "preview", "live"].includes(input.mode)) return { success: false, error: "Invalid mode." };
  if (!ASSISTANT_MODELS.some((m) => m.id === input.model)) return { success: false, error: "Choose a model from the list." };
  if (!["low", "medium", "high"].includes(input.effort)) return { success: false, error: "Invalid effort." };
  if (!Number.isFinite(input.dailyBudgetUsd) || input.dailyBudgetUsd < 0 || input.dailyBudgetUsd > 1000) {
    return { success: false, error: "Daily budget must be between $0 and $1,000." };
  }
  if (!intInRange(input.maxMessagesPerConversation, 1, 200)) return { success: false, error: "Messages per chat must be 1-200." };
  if (!intInRange(input.maxMessagesPerHour, 1, 200)) return { success: false, error: "Messages per hour must be 1-200." };
  if (!intInRange(input.maxNewChatsPerIpPerDay, 1, 500)) return { success: false, error: "New chats per connection must be 1-500." };
  if (!intInRange(input.retentionDays, 1, 730)) return { success: false, error: "Retention must be 1-730 days." };
  if (input.greeting.length > 500) return { success: false, error: "Greeting is too long (500 characters max)." };
  if (input.businessInfo.length > 20000) return { success: false, error: "Business information is too long (20,000 characters max)." };
  if (input.salesInstructions.length > 12000) return { success: false, error: "Instructions are too long (12,000 characters max)." };

  const { error } = await createAdminClient()
    .from("assistant_settings")
    .update({
      mode: input.mode,
      model: input.model,
      effort: input.effort,
      daily_budget_usd: Math.round(input.dailyBudgetUsd * 100) / 100,
      max_messages_per_conversation: input.maxMessagesPerConversation,
      max_messages_per_hour: input.maxMessagesPerHour,
      max_new_chats_per_ip_per_day: input.maxNewChatsPerIpPerDay,
      retention_days: input.retentionDays,
      greeting: input.greeting.trim(),
      business_info: input.businessInfo.trim(),
      sales_instructions: input.salesInstructions.trim(),
      updated_at: new Date().toISOString(),
      updated_by: auth.email,
    })
    .eq("id", 1);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/assistant");
  return { success: true };
}
