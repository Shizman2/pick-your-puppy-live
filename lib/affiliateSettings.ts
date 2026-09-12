import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { AffiliateProgramSettingsRow } from "./affiliateTypes";

const FALLBACK: AffiliateProgramSettingsRow = {
  commission_hold_days: 10,
  attribution_window_days: 30,
  default_commission_type: "percent_bp",
  default_commission_value: 1000,
};

export async function getAffiliateProgramSettings(): Promise<AffiliateProgramSettingsRow> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("affiliate_program_settings")
    .select("commission_hold_days, attribution_window_days, default_commission_type, default_commission_value")
    .eq("id", true)
    .maybeSingle();

  return (data as AffiliateProgramSettingsRow) || FALLBACK;
}
