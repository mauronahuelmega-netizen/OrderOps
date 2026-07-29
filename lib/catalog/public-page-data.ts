import "server-only";

import type { PublicBusiness } from "@/lib/business/public";
import {
  getPublicCatalogByBusinessId,
  type PublicCategory,
  type PublicProduct
} from "@/lib/catalog/public";
import { getPublicCustomizationSummariesForProducts } from "@/lib/product-customization/public";

export type PublicCatalogPageData = {
  categories: PublicCategory[];
  products: PublicProduct[];
  productCustomizationEnabled: boolean;
};

/**
 * Per-request loader for `/b/[slug]/catalogo`.
 * Dedupes customization flag + products re-fetch for summaries.
 * No persistent cache / revalidate.
 */
export async function getPublicCatalogPageData(
  business: PublicBusiness
): Promise<PublicCatalogPageData> {
  const { categories, products } = await getPublicCatalogByBusinessId(business.id);
  const productCustomizationEnabled = business.product_customization_enabled === true;

  if (!productCustomizationEnabled || products.length === 0) {
    return {
      categories,
      products,
      productCustomizationEnabled
    };
  }

  const corpusProducts = products.map((product) => ({
    id: product.id,
    category_id: product.category_id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image_url,
    is_available: true
  }));

  const summaries = await getPublicCustomizationSummariesForProducts({
    businessId: business.id,
    productIds: products.map((product) => product.id),
    productCustomizationEnabled: true,
    products: corpusProducts,
    reuseProductsForSuggested: true
  });

  const enrichedProducts = products.map((product) => {
    const summary = summaries.get(product.id);
    if (!summary) {
      return product;
    }

    return {
      ...product,
      customizationSummary: {
        hasCustomizations: summary.hasCustomizations,
        hasPaidCustomizations: summary.hasPaidCustomizations,
        hasUpsell: summary.hasUpsell,
        priceFrom: summary.priceFrom
      }
    };
  });

  return {
    categories,
    products: enrichedProducts,
    productCustomizationEnabled
  };
}
