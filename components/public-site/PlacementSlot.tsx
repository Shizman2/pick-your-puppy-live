import "./media-placement.css";
import { getPlacementsForSlot } from "../../lib/media";
import type { MediaPlacementWithAsset, PageType, SlotId } from "../../lib/mediaTypes";

function PlacementImage({ placement }: { placement: MediaPlacementWithAsset }) {
  const { asset } = placement;

  const wrapClass = [
    "pp-media-placement-wrap",
    !placement.mobile_visible ? "pp-media-hide-mobile" : "",
    !placement.desktop_visible ? "pp-media-hide-desktop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const innerStyle: React.CSSProperties = {
    maxWidth: placement.max_width_px ? `${placement.max_width_px}px` : undefined,
    height: placement.height_px ? `${placement.height_px}px` : undefined,
    borderRadius: `${placement.border_radius_px}px`,
    backgroundColor: placement.background_color || undefined,
    paddingTop: placement.padding_top_px ? `${placement.padding_top_px}px` : undefined,
    paddingBottom: placement.padding_bottom_px ? `${placement.padding_bottom_px}px` : undefined,
    marginLeft: placement.alignment === "right" ? "auto" : undefined,
    marginRight: placement.alignment === "left" ? "auto" : undefined,
    margin: placement.alignment === "center" ? "0 auto" : undefined,
  };

  const imgStyle: React.CSSProperties = {
    objectFit: placement.fit_mode === "natural" ? undefined : placement.fit_mode,
    transform:
      placement.image_scale_percent !== 100 || placement.image_offset_x !== 0 || placement.image_offset_y !== 0
        ? `scale(${placement.image_scale_percent / 100}) translate(${placement.image_offset_x}px, ${placement.image_offset_y}px)`
        : undefined,
    height: placement.height_px ? "100%" : undefined,
  };

  const altText = asset.is_decorative ? "" : asset.alt_text || "";

  const image = (
    <picture>
      {asset.mobile_file_url && <source media="(max-width: 767px)" srcSet={asset.mobile_file_url} />}
      {asset.desktop_file_url && <source media="(min-width: 768px)" srcSet={asset.desktop_file_url} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pp-media-placement-img" src={asset.file_url} alt={altText} style={imgStyle} />
    </picture>
  );

  return (
    <div className={wrapClass}>
      <div className="pp-media-placement-inner" style={innerStyle}>
        {placement.link_url ? (
          <a href={placement.link_url} target={placement.link_target}>
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    </div>
  );
}

export default async function PlacementSlot({
  pageType,
  slot,
  pageIdentifier,
  previewToken,
}: {
  pageType: PageType;
  slot: SlotId;
  pageIdentifier?: string | null;
  previewToken?: string | null;
}) {
  const placements = await getPlacementsForSlot(pageType, slot, pageIdentifier, previewToken);
  if (placements.length === 0) return null;

  return (
    <>
      {placements.map((p) => (
        <PlacementImage key={p.id} placement={p} />
      ))}
    </>
  );
}
