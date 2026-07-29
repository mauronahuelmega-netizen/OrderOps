"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import {
  getSupabaseImageLoader,
  toSupabaseObjectPublicUrl
} from "@/lib/supabase/image-loader";
import { isOptimizableProductImageUrl } from "@/lib/products/product-image";

type PublicStorageImageProps = Omit<ImageProps, "src" | "loader" | "unoptimized" | "quality"> & {
  src: string;
  quality?: number;
};

/**
 * Public catalog/business Image with Supabase render loader + origin fallback
 * when Image Transformations are unavailable (403 FeatureNotEnabled).
 *
 * Primary path remains `/storage/v1/render/image/public/...` via loader.
 * Fallback to object URL is per-src and only after onError — never the default
 * for optimizable Supabase URLs.
 */
export default function PublicStorageImage({
  src,
  alt,
  onError,
  quality = 80,
  ...rest
}: PublicStorageImageProps) {
  const optimizable = isOptimizableProductImageUrl(src);
  const [useOriginFallback, setUseOriginFallback] = useState(false);

  useEffect(() => {
    setUseOriginFallback(false);
  }, [src]);

  const displaySrc =
    optimizable && useOriginFallback ? toSupabaseObjectPublicUrl(src) : src;

  return (
    <Image
      src={displaySrc}
      alt={alt}
      {...(useOriginFallback || !optimizable
        ? { unoptimized: true }
        : { loader: getSupabaseImageLoader, quality })}
      onError={(event) => {
        if (optimizable && !useOriginFallback) {
          setUseOriginFallback(true);
          return;
        }

        onError?.(event);
      }}
      {...rest}
    />
  );
}
