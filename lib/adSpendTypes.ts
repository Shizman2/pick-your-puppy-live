export type AdSpendPlatform = "meta" | "google" | "tiktok" | "other";

export const AD_SPEND_PLATFORM_OPTIONS: AdSpendPlatform[] = ["meta", "google", "tiktok", "other"];

export const AD_SPEND_PLATFORM_LABEL: Record<AdSpendPlatform, string> = {
  meta: "Meta",
  google: "Google",
  tiktok: "TikTok",
  other: "Other",
};

export interface AdSpendEntryRow {
  id: string;
  spend_date: string;
  amount_cents: number;
  platform: AdSpendPlatform;
  campaign_name: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}
