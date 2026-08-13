"use client";

import { useState } from "react";
import AssetLibraryTab from "./AssetLibraryTab";
import PlacementsTab from "./PlacementsTab";
import type { MediaAssetRow, MediaPlacementWithAsset } from "../../../lib/mediaTypes";

export interface PuppyOption {
  id: string;
  name: string;
  slug: string;
}

export default function MediaManagerClient({
  initialAssets,
  initialPlacements,
  usageCounts,
  puppies,
}: {
  initialAssets: MediaAssetRow[];
  initialPlacements: MediaPlacementWithAsset[];
  usageCounts: Record<string, number>;
  puppies: PuppyOption[];
}) {
  const [tab, setTab] = useState<"assets" | "placements">("assets");

  return (
    <div>
      <div className="media-tabs">
        <button className={`media-tab${tab === "assets" ? " active" : ""}`} onClick={() => setTab("assets")}>
          Asset Library
        </button>
        <button className={`media-tab${tab === "placements" ? " active" : ""}`} onClick={() => setTab("placements")}>
          Placements
        </button>
      </div>

      {tab === "assets" ? (
        <AssetLibraryTab assets={initialAssets} usageCounts={usageCounts} />
      ) : (
        <PlacementsTab placements={initialPlacements} assets={initialAssets} puppies={puppies} />
      )}
    </div>
  );
}
