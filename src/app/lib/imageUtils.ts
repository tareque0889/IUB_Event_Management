/**
 * imageUtils.ts
 *
 * Helpers for serving right-sized, modern-format images. Event posters and
 * club covers are external Unsplash URLs; Unsplash's imgix CDN can resize
 * and auto-negotiate WebP/AVIF for us via query params, so we never ship a
 * 2000px JPEG into a 300px card.
 */

const UNSPLASH_HOST = /(^|\.)images\.unsplash\.com$/;

/** Card widths we request; browsers pick the closest one via `sizes`. */
export const CARD_WIDTHS = [320, 480, 640, 960] as const;

function isUnsplash(url: string): boolean {
  try {
    return UNSPLASH_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Returns `url` resized to `width` px. For Unsplash this sets
 * `auto=format` (WebP/AVIF negotiation), `fit=crop`, `q=70`. Non-Unsplash
 * URLs are returned unchanged.
 */
export function sizedImageUrl(url: string, width: number): string {
  if (!url || !isUnsplash(url)) return url;
  const u = new URL(url);
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", "70");
  u.searchParams.delete("h");
  return u.toString();
}

/** Builds a `srcSet` string for responsive `<img>`; empty for non-Unsplash. */
export function imageSrcSet(
  url: string,
  widths: readonly number[] = CARD_WIDTHS,
): string | undefined {
  if (!url || !isUnsplash(url)) return undefined;
  return widths.map((w) => `${sizedImageUrl(url, w)} ${w}w`).join(", ");
}

/** Default `sizes` for a grid card that spans 1–4 columns. */
export const CARD_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
