export type MediaType = "image_banner" | "image_only" | "promo_banner";

export interface MediaAssetRow {
  id: string;
  internal_name: string;
  file_url: string;
  mobile_file_url: string | null;
  desktop_file_url: string | null;
  media_type: MediaType;
  alt_text: string | null;
  is_decorative: boolean;
  width: number | null;
  height: number | null;
  file_size: number | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type PageType = "homepage" | "puppy_finder" | "puppies" | "puppy_detail";

export type SlotId =
  | "global_below_header"
  | "homepage_hero"
  | "homepage_below_puppies"
  | "puppy_finder_hero"
  | "puppy_finder_above_form"
  | "puppy_detail_below_description"
  | "puppy_detail_above_reserve";

export type DisplayMode = "single" | "stacked";
export type PlacementStatus = "draft" | "published" | "paused";
export type FitMode = "contain" | "cover" | "natural";
export type Alignment = "left" | "center" | "right";
export type LinkTarget = "_self" | "_blank";

export interface MediaPlacementRow {
  id: string;
  internal_name: string;
  media_asset_id: string;

  page_type: PageType;
  page_identifier: string | null;
  slot: SlotId;

  display_mode: DisplayMode;
  priority: number;

  enabled: boolean;
  status: PlacementStatus;

  start_at: string | null;
  end_at: string | null;

  mobile_visible: boolean;
  desktop_visible: boolean;

  link_url: string | null;
  link_target: LinkTarget;

  fit_mode: FitMode;
  alignment: Alignment;

  max_width_px: number | null;
  height_px: number | null;
  border_radius_px: number;
  background_color: string | null;

  image_scale_percent: number;
  image_offset_x: number;
  image_offset_y: number;
  padding_top_px: number;
  padding_bottom_px: number;

  preview_token: string | null;
  preview_token_expires_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface MediaPlacementWithAsset extends MediaPlacementRow {
  asset: MediaAssetRow;
}

export const PAGE_TYPES: { key: PageType; label: string }[] = [
  { key: "homepage", label: "Homepage" },
  { key: "puppy_finder", label: "Puppy Finder" },
  { key: "puppies", label: "Puppies (listing page)" },
  { key: "puppy_detail", label: "Puppy Detail Pages" },
];

export const SLOTS_BY_PAGE_TYPE: Record<PageType, { key: SlotId; label: string }[]> = {
  homepage: [
    { key: "global_below_header", label: "Below Header" },
    { key: "homepage_hero", label: "Hero Area" },
    { key: "homepage_below_puppies", label: "Below Available Puppies" },
  ],
  puppy_finder: [
    { key: "global_below_header", label: "Below Header" },
    { key: "puppy_finder_hero", label: "Hero Area" },
    { key: "puppy_finder_above_form", label: "Above Form" },
  ],
  puppies: [{ key: "global_below_header", label: "Below Header" }],
  puppy_detail: [
    { key: "global_below_header", label: "Below Header" },
    { key: "puppy_detail_below_description", label: "Below Description" },
    { key: "puppy_detail_above_reserve", label: "Above Reserve Button" },
  ],
};

export const IMAGE_SCALE_MIN = 25;
export const IMAGE_SCALE_MAX = 200;
export const IMAGE_OFFSET_MIN = -300;
export const IMAGE_OFFSET_MAX = 300;
export const BORDER_RADIUS_MAX = 60;
