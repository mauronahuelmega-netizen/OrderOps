import type { ImageLoaderProps } from "next/image";

const OBJECT_PUBLIC_PREFIX = "/storage/v1/object/public/";
const RENDER_PUBLIC_PREFIX = "/storage/v1/render/image/public/";

const MIN_DIMENSION = 1;
const MAX_DIMENSION = 2500;
const MIN_QUALITY = 20;
const MAX_QUALITY = 100;
const DEFAULT_QUALITY = 80;

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_DIMENSION;
  }

  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(value)));
}

function clampQuality(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_QUALITY;
  }

  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, Math.round(value)));
}

function isSupabaseStorageHost(hostname: string): boolean {
  return hostname.endsWith(".supabase.co");
}

/** Normalizes render URLs back to the public object origin (no transform params). */
export function toSupabaseObjectPublicUrl(src: string): string {
  try {
    const url = new URL(src);

    if (!isSupabaseStorageHost(url.hostname)) {
      return src;
    }

    if (url.pathname.startsWith(RENDER_PUBLIC_PREFIX)) {
      url.pathname = url.pathname.replace(RENDER_PUBLIC_PREFIX, OBJECT_PUBLIC_PREFIX);
    }

    url.search = "";
    return url.toString();
  } catch {
    return src;
  }
}

function toSupabaseRenderUrl(src: string, width: number, quality: number): string {
  const normalizedWidth = clampDimension(width);
  const normalizedQuality = clampQuality(quality);

  const url = new URL(src);

  if (!isSupabaseStorageHost(url.hostname)) {
    return src;
  }

  if (url.pathname.startsWith(OBJECT_PUBLIC_PREFIX)) {
    url.pathname = url.pathname.replace(OBJECT_PUBLIC_PREFIX, RENDER_PUBLIC_PREFIX);
  } else if (!url.pathname.startsWith(RENDER_PUBLIC_PREFIX)) {
    return src;
  }

  url.searchParams.set("width", String(normalizedWidth));
  url.searchParams.set("quality", String(normalizedQuality));

  return url.toString();
}

/**
 * Builds a Supabase Storage render URL so imgproxy handles resize/encode
 * instead of Next.js fetching and re-processing the full origin asset.
 *
 * Requires Image Transformations enabled on the Supabase project; otherwise
 * the render endpoint responds 403 FeatureNotEnabled and callers should fall
 * back to `toSupabaseObjectPublicUrl` with `unoptimized`.
 */
export function getSupabaseImageLoader(
  props: ImageLoaderProps
): string;
export function getSupabaseImageLoader(
  src: string,
  width: number,
  quality?: number
): string;
export function getSupabaseImageLoader(
  srcOrProps: string | ImageLoaderProps,
  width?: number,
  quality?: number
): string {
  if (typeof srcOrProps === "string") {
    return toSupabaseRenderUrl(
      srcOrProps,
      width ?? MIN_DIMENSION,
      quality ?? DEFAULT_QUALITY
    );
  }

  return toSupabaseRenderUrl(
    srcOrProps.src,
    srcOrProps.width,
    srcOrProps.quality ?? DEFAULT_QUALITY
  );
}

export default getSupabaseImageLoader;
