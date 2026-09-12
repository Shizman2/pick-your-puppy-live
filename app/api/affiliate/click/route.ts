import { NextRequest, NextResponse } from "next/server";
import { recordAffiliateClick, AFFILIATE_CLICK_COOKIE } from "../../../../lib/affiliateAttribution";

export const dynamic = "force-dynamic";

/**
 * Fired client-side (see components/public/AffiliateClickCapture.tsx)
 * whenever a page loads with ?ref=CODE in the URL - deliberately NOT
 * handled in middleware, to keep any risk of a mistake here completely
 * isolated from the admin/affiliate auth gating in middleware.ts.
 *
 * Always returns 200 even when the code is invalid/inactive - never
 * reveals which referral codes are real.
 */
export async function POST(request: NextRequest) {
  let body: { code?: string; landingPath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const code = String(body.code || "").trim();
  if (!code) return NextResponse.json({ success: false }, { status: 400 });

  const click = await recordAffiliateClick(code, body.landingPath || null);
  const response = NextResponse.json({ success: true });

  if (click) {
    const maxAgeSeconds = Math.max(0, Math.floor((new Date(click.expiresAt).getTime() - Date.now()) / 1000));
    response.cookies.set(AFFILIATE_CLICK_COOKIE, click.clickId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });
  }

  return response;
}
