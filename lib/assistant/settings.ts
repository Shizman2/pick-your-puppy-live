import "server-only";
import { createAdminClient } from "../supabase/admin";
import { DEFAULT_ASSISTANT_MODEL, type AssistantEffort, type AssistantMode } from "./config";

export interface AssistantSettings {
  mode: AssistantMode;
  model: string;
  effort: AssistantEffort;
  daily_budget_usd: number;
  max_messages_per_conversation: number;
  max_messages_per_hour: number;
  max_new_chats_per_ip_per_day: number;
  retention_days: number;
  greeting: string;
  business_info: string;
  sales_instructions: string;
  updated_at: string | null;
}

/** Used when the table is missing (migration 040 not run) - the assistant stays off. */
export const FALLBACK_SETTINGS: AssistantSettings = {
  mode: "off",
  model: DEFAULT_ASSISTANT_MODEL,
  effort: "low",
  daily_budget_usd: 0,
  max_messages_per_conversation: 40,
  max_messages_per_hour: 20,
  max_new_chats_per_ip_per_day: 10,
  retention_days: 90,
  greeting: "",
  business_info: "",
  sales_instructions: "",
  updated_at: null,
};

/** Never throws: any read failure means "off". `missing` is true when the table doesn't exist yet. */
export async function getAssistantSettings(): Promise<{ settings: AssistantSettings; missing: boolean }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("assistant_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return { settings: FALLBACK_SETTINGS, missing: true };
    return {
      settings: {
        ...FALLBACK_SETTINGS,
        ...data,
        daily_budget_usd: Number(data.daily_budget_usd) || 0,
      } as AssistantSettings,
      missing: false,
    };
  } catch {
    return { settings: FALLBACK_SETTINGS, missing: true };
  }
}
