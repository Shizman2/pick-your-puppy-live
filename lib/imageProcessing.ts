import "server-only";
import sharp from "sharp";

/**
 * Resizes and re-compresses an image buffer for web delivery.
 * - Caps the longest edge at maxDimension (1600px is generous even for
 *   a full-width detail-page gallery photo on a high-DPI phone).
 * - Re-encodes as JPEG at quality 82, which is a safe, broadly-supported
 *   sweet spot between file size and visible quality for photos.
 * - Never upscales a smaller source image.
 *
 * Used for puppy gallery photos (app/admin/puppies/actions.ts), which
 * are always already-opaque phone photos - JPEG's lack of an alpha
 * channel has never mattered here. For an image that needs to KEEP
 * transparency (e.g. a Breed Profile cutout image), use
 * resizeImagePreservingTransparency below instead - this function
 * intentionally still has no flatten/alpha handling of its own, so it
 * stays exactly what every existing puppy-photo upload already expects.
 */
export async function resizeImageForWeb(
  input: Buffer,
  maxDimension: number = 1600
): Promise<{ buffer: Buffer; contentType: string }> {
  const buffer = await sharp(input)
    .rotate() // respect EXIF orientation from phone cameras before resizing
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return { buffer, contentType: "image/jpeg" };
}

/**
 * Resizes an image for web delivery WITHOUT discarding transparency -
 * for images meant to be composited onto a colored background rather
 * than shown as an opaque rectangle (e.g. a Breed Profile cutout image,
 * see uploadBreedProfileImage in app/admin/breeds/actions.ts). JPEG has
 * no alpha channel, so this always outputs PNG when the source has one;
 * an already-opaque source is still re-encoded as PNG for simplicity
 * (there's no bulk-photo-count pressure for breed images the way there
 * is for puppy galleries, so PNG's larger size here is a non-issue).
 * Deliberately a separate function rather than a flag on
 * resizeImageForWeb, so puppy-photo uploads can never be accidentally
 * affected by a Breed-Profile-only concern.
 */
export async function resizeImagePreservingTransparency(
  input: Buffer,
  maxDimension: number = 800
): Promise<{ buffer: Buffer; contentType: string }> {
  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();

  return { buffer, contentType: "image/png" };
}
