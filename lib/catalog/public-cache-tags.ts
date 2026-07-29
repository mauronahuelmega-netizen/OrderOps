import "server-only";

import { revalidatePath, updateTag } from "next/cache";

/** Stable public business branding/settings for a slug. */
export function publicBusinessTag(slugOrBusinessId: string): string {
  return `public-business:${slugOrBusinessId.trim().toLowerCase()}`;
}

/** Public categories/products visible in the catalog. */
export function publicCatalogTag(businessId: string): string {
  return `public-catalog:${businessId.trim()}`;
}

/** Public customization summaries / corpus-derived card data. */
export function publicCustomizationTag(businessId: string): string {
  return `public-customization:${businessId.trim()}`;
}

export function publicCatalogSlugPath(slug: string): string {
  return `/b/${slug.trim().toLowerCase()}/catalogo`;
}

export type RevalidatePublicCatalogCacheInput = {
  businessId?: string;
  slug?: string | null;
  /** When slug changes, also expire the previous public business tag/path. */
  previousSlug?: string | null;
  /**
   * - catalog: products/categories (+ customization summaries that depend on them)
   * - business: branding/settings/copy
   * - customization: groups/options/assignments/upsell
   * - all: business + catalog + customization
   */
  scope?: "catalog" | "business" | "customization" | "all";
};

/**
 * Central public-catalog cache invalidation for admin Server Actions.
 * Uses updateTag for immediate data-cache expiry (Next 16 Server Actions).
 */
export function revalidatePublicCatalogCache(
  input: RevalidatePublicCatalogCacheInput
): void {
  const scope = input.scope ?? "all";
  const slug = input.slug?.trim().toLowerCase() || null;
  const previousSlug = input.previousSlug?.trim().toLowerCase() || null;
  const businessId = input.businessId?.trim() || null;

  const touchBusiness = scope === "business" || scope === "all";
  const touchCatalog =
    scope === "catalog" || scope === "customization" || scope === "all";
  const touchCustomization =
    scope === "customization" ||
    scope === "all" ||
    // Product/category edits change priceFrom / availability summaries.
    scope === "catalog";

  if (touchBusiness && slug) {
    updateTag(publicBusinessTag(slug));
  }

  if (previousSlug && previousSlug !== slug) {
    updateTag(publicBusinessTag(previousSlug));
    revalidatePath(publicCatalogSlugPath(previousSlug));
    revalidatePath(`/b/${previousSlug}`);
  }

  if (businessId && touchCatalog) {
    updateTag(publicCatalogTag(businessId));
  }

  if (businessId && touchCustomization) {
    updateTag(publicCustomizationTag(businessId));
  }

  if (slug) {
    revalidatePath(publicCatalogSlugPath(slug));
    if (touchBusiness) {
      revalidatePath(`/b/${slug}`);
    }
  }
}
