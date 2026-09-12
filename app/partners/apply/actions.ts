"use server";

import { headers } from "next/headers";
import { createAdminClient } from "../../../lib/supabase/admin";
import { normalizeEmail } from "../../../lib/normalize";
import { generateUniqueReferralCode } from "../../../lib/affiliates";
import { getAffiliateProgramSettings } from "../../../lib/affiliateSettings";

export type ApplyResult = { success: true } | { success: false; error: string };

// Same best-effort per-IP limiter pattern as app/api/inquire/route.ts -
// not perfectly reliable on Netlify's serverless functions (see that
// file's comment), but stops naive rapid-fire spam on a warm instance.
const submissionLog = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export interface AffiliateApplicationFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  socialUrl: string;
  promotionPlan: string;
  notes: string;
  website: string; // honeypot - real applicants never fill this in
}

export async function submitAffiliateApplication(fields: AffiliateApplicationFields): Promise<ApplyResult> {
  if (fields.website.trim() !== "") {
    // Honeypot tripped - return a normal-looking success so bots don't
    // learn to avoid it, same approach as app/api/inquire/route.ts.
    return { success: true };
  }

  const ip = headers().get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return { success: false, error: "Too many submissions - please try again later." };
  }

  const firstName = fields.firstName.trim();
  const email = fields.email.trim();

  if (!firstName || !email) {
    return { success: false, error: "First name and email are required." };
  }

  const emailNormalized = normalizeEmail(email);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("affiliates")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: "An application with this email has already been submitted. We'll be in touch if it's still under review.",
    };
  }

  const settings = await getAffiliateProgramSettings();

  // generateUniqueReferralCode checks for a collision before returning a
  // code, but that check-then-insert has a race window (two submissions
  // with the same first name landing at nearly the same time could both
  // pass the check before either has inserted). Rather than rely on the
  // check alone, retry with a freshly generated code if the insert itself
  // hits the referral_code unique constraint - this is a real, if rare,
  // race the checked-then-insert pattern can't fully close on its own.
  for (let attempt = 0; attempt < 3; attempt++) {
    const referralCode = await generateUniqueReferralCode(firstName);

    const { error } = await admin.from("affiliates").insert({
      first_name: firstName,
      last_name: fields.lastName.trim() || null,
      display_name: `${firstName} ${fields.lastName.trim() || ""}`.trim(),
      email,
      email_normalized: emailNormalized,
      phone: fields.phone.trim() || null,
      social_url: fields.socialUrl.trim() || null,
      promotion_plan: fields.promotionPlan.trim() || null,
      application_notes: fields.notes.trim() || null,
      referral_code: referralCode,
      status: "pending",
      // New applicants start on the program default commission rate -
      // the CHECK constraint on affiliates requires a value matching
      // whichever commission_type is set, so both must be written here.
      commission_type: settings.default_commission_type,
      commission_flat_cents: settings.default_commission_type === "flat_cents" ? settings.default_commission_value : null,
      commission_percent_bp: settings.default_commission_type === "percent_bp" ? settings.default_commission_value : null,
    });

    if (!error) return { success: true };

    const isReferralCodeCollision = error.code === "23505" && error.message.includes("referral_code");
    if (!isReferralCodeCollision) {
      return { success: false, error: "Could not submit your application. Please try again." };
    }
    // else: loop and retry with a new code.
  }

  return { success: false, error: "Could not submit your application. Please try again." };
}
