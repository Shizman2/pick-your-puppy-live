import "server-only";
import sharp from "sharp";

/**
 * Resizes and re-compresses an image buffer for web delivery.
 * - Caps the longest edge at maxDimension (1600px is generous even for
 *   a full-width detail-page gallery photo on a high-DPI phone).
 * - Re-encodes as JPEG at quality 82, which is a safe, broadly-supported
 *   sweet spot between file size and visible quality for photos.
 * - Never upscales a smaller source image.
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
