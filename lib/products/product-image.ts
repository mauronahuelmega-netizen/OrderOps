/** Matches `--bg-surface-hover` / product summary placeholder base (#e6ddd1). */
export const PRODUCT_SUMMARY_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlNmRkZDEiLz48L3N2Zz4=";

export function isOptimizableProductImageUrl(imageUrl: string | null | undefined): imageUrl is string {
  if (!imageUrl) {
    return false;
  }

  try {
    const parsed = new URL(imageUrl);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".supabase.co") &&
      (parsed.pathname.startsWith("/storage/v1/object/public/") ||
        parsed.pathname.startsWith("/storage/v1/render/image/public/"))
    );
  } catch {
    return false;
  }
}
