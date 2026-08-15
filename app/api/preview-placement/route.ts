import { NextRequest, NextResponse } from "next/server";
import { getPlacementByPreviewTokenForSlot } from "../../../lib/media";
import type { PageType, SlotId } from "../../../lib/mediaTypes";

export const dynamic = "force-dynamic";

/**
 * Client-side counterpart to the server-side preview-token lookup in
 * lib/media.ts. Exists so the public homepage / puppy-finder / puppy
 * detail pages can stay static (no searchParams read server-side) while
 * still supporting the admin "preview a draft placement" link - the
 * token itself is the only credential required, matching the existing
 * getPlacementsForSlot behavior this mirrors.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageType = searchParams.get("pageType") as PageType | null;
  const slot = searchParams.get("slot") as SlotId | null;
  const pageIdentifier = searchParams.get("pageIdentifier");
  const token = searchParams.get("token");

  if (!pageType || !slot || !token) {
    return NextResponse.json({ placement: null }, { status: 400 });
  }

  const placement = await getPlacementByPreviewTokenForSlot(pageType, slot, pageIdentifier, token);
  return NextResponse.json({ placement });
}
