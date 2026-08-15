"use client";

import { useEffect, useState } from "react";
import PlacementImage from "./PlacementImage";
import type { MediaPlacementWithAsset, PageType, SlotId } from "../../lib/mediaTypes";

/**
 * Renders nothing for a normal visitor - it only does anything when the
 * URL carries ?previewToken=..., which is how the admin Website/Media
 * editor generates "preview this draft" links. Reading the token via
 * window.location (client-only, post-mount) instead of the searchParams
 * prop/useSearchParams() is deliberate: it keeps the page itself static
 * (no server-side searchParams read forces dynamic rendering), and a
 * plain client component has no Suspense-boundary requirement to worry
 * about either.
 *
 * Shown alongside the normal published PlacementSlot rather than
 * replacing it in place - simpler and lower-risk than trying to swap
 * server-rendered content after hydration, and for an admin-only
 * preview tool, seeing the draft clearly labeled next to the live
 * content is arguably more useful anyway.
 */
export default function PlacementPreviewOverlay({
  pageType,
  slot,
  pageIdentifier,
}: {
  pageType: PageType;
  slot: SlotId;
  pageIdentifier?: string | null;
}) {
  const [placement, setPlacement] = useState<MediaPlacementWithAsset | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("previewToken");
    if (!token) return;

    const params = new URLSearchParams({ pageType, slot, token });
    if (pageIdentifier) params.set("pageIdentifier", pageIdentifier);

    fetch(`/api/preview-placement?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.placement) setPlacement(data.placement);
      })
      .catch(() => {
        // Invalid/expired token or network hiccup - just show nothing extra.
      });
  }, [pageType, slot, pageIdentifier]);

  if (!placement) return null;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          zIndex: 10,
          background: "#f59e0b",
          color: "#111827",
          fontSize: 11,
          fontWeight: 800,
          padding: "2px 8px",
          borderRadius: 6,
          letterSpacing: "0.03em",
        }}
      >
        PREVIEW
      </div>
      <PlacementImage placement={placement} />
    </div>
  );
}
