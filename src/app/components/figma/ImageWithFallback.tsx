import React, { useState } from "react";
import { CARD_SIZES, imageSrcSet, sizedImageUrl } from "../../lib/imageUtils";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /**
   * Largest width (px) the image is displayed at. Used to pick the `src`
   * fallback size for CDN-resizable URLs. Defaults to 640.
   */
  displayWidth?: number;
  /**
   * Set for above-the-fold images (hero/detail header) so the browser fetches
   * them immediately instead of lazily.
   */
  priority?: boolean;
};

/**
 * `<img>` with an inline SVG fallback on error. Defaults every image to
 * `loading="lazy"` + `decoding="async"` and, for Unsplash URLs, emits a
 * responsive `srcSet` so cards download ~30 KB WebP instead of a 1 MB JPEG.
 */
export function ImageWithFallback({
  src,
  alt,
  style,
  className,
  displayWidth = 640,
  priority = false,
  sizes,
  loading,
  decoding,
  ...rest
}: Props) {
  const [didError, setDidError] = useState(false);

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={ERROR_IMG_SRC}
            alt="Error loading image"
            {...rest}
            data-original-url={src}
          />
        </div>
      </div>
    );
  }

  const url = src ?? "";
  const srcSet = imageSrcSet(url);

  return (
    <img
      src={sizedImageUrl(url, displayWidth)}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? CARD_SIZES) : sizes}
      alt={alt}
      className={className}
      style={style}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding ?? "async"}
      // React 18 types don't know fetchPriority yet; the attribute is valid HTML.
      {...(priority ? { fetchpriority: "high" } : {})}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
}
