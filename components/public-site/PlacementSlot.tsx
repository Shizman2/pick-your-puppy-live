import { getPlacementsForSlot } from "../../lib/media";
import type { PageType, SlotId } from "../../lib/mediaTypes";
import PlacementImage from "./PlacementImage";

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
