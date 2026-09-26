import { NextResponse } from "next/server";
import { requireAdminUser } from "../../../../lib/authz";
import { getOnlineNow } from "../../../../lib/analytics/queries";

export const dynamic = "force-dynamic";

/**
 * Polled client-side by the admin Analytics page's Online Now widget
 * (every ~20 seconds - see components/admin/analytics/OnlineNowWidget.tsx).
 * Not covered by middleware.ts (which only matches /admin/*, /partners/*,
 * /show/*), so this route re-checks admin auth itself, same guard used
 * by admin Server Actions elsewhere (lib/authz.ts).
 */
export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const data = await getOnlineNow();
  return NextResponse.json(data);
}
