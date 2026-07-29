import "server-only";

import type { PublicBusiness } from "@/lib/business/public";
import { getCachedPublicCatalogPageStableData } from "@/lib/catalog/public-cached-data";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/public";
import { getFreshPublicOrderingStatus } from "@/lib/store-sessions/public.server";

export type PublicCatalogPageData = {
  business: PublicBusiness;
  categories: PublicCategory[];
  products: PublicProduct[];
  productCustomizationEnabled: boolean;
};

/**
 * Catalog page loader: cached stable catalog + fresh ordering acceptance.
 */
export async function getPublicCatalogPageData(
  slug: string
): Promise<PublicCatalogPageData | null> {
  const stable = await getCachedPublicCatalogPageStableData(slug);
  if (!stable) {
    return null;
  }

  const acceptingOrders = await getFreshPublicOrderingStatus(stable.business.id);

  return {
    business: {
      ...stable.business,
      on_demand_mode_active: acceptingOrders
    },
    categories: stable.categories,
    products: stable.products,
    productCustomizationEnabled: stable.productCustomizationEnabled
  };
}
