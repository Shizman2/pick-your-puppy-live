/**
 * Rewrites a Supabase Storage public-object URL into its on-the-fly
 * resized/cropped equivalent, using Supabase's built-in image
 * transformation endpoint (confirmed enabled on this project). This
 * needs no changes to the upload pipeline, storage schema, or the
 * shared lib/imageProcessing.ts resize/compress step - the original
 * full-size file stays exactly as uploaded; only the URL used to
 * *display* it changes, per call site, to request an appropriately
 * sized variant instead of downloading the full ~1600px original for
 * something as small as a thumbnail.
 *
 * If the URL isn't a Supabase Storage public-object URL (e.g. the
 * empty-string placeholder used when a puppy has no photos yet), it's
 * returned unchanged.
 */
export function transformPhotoUrl(
  url: string,
  options: { width: number; height: number; resize?: "cover" | "contain" | "fill" }
): string {
  if (!url) return url;

  const marker = "/storage/v1/object/public/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return url;

  const base = url.slice(0, markerIndex);
  const pathAndQuery = url.slice(markerIndex + marker.length);
  const transformed = `${base}/storage/v1/render/image/public/${pathAndQuery}`;

  const params = new URLSearchParams({
    width: String(options.width),
    height: String(options.height),
    resize: options.resize || "cover",
  });

  return `${transformed}?${params.toString()}`;
}
