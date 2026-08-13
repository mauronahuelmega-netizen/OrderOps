import "server-only";

import { loadPublicCatalogByBusinessId } from "@/lib/catalog/public";

/**
 * True when the public catalog would show at least one category with
 * one or more available products — same visibility semantics as CatalogClient.
 *
 * Does NOT consider store-session / on_demand acceptance.
 */
export async function hasReadyPublicCatalog(businessId: string): Promise<boolean> {
  const normalizedBusinessId = businessId.trim();
  if (!normalizedBusinessId) {
    return false;
  }

  const { categories, products } = await loadPublicCatalogByBusinessId(normalizedBusinessId);

  if (categories.length === 0 || products.length === 0) {
    return false;
  }

  const categoryIds = new Set(categories.map((category) => category.id));

  return products.some(
    (product) => Boolean(product.category_id) && categoryIds.has(product.category_id)
  );
}
