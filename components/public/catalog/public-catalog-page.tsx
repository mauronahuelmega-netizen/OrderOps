import CatalogClient from "@/components/public/catalog/catalog-client";
import type { PublicBusiness } from "@/lib/business/public";
import { getPublicCatalogByBusinessId } from "@/lib/catalog/public";
import { isProductCustomizationEnabled } from "@/lib/product-customization/flags";
import { getPublicCustomizationSummariesForProducts } from "@/lib/product-customization/public";

type PublicCatalogPageContentProps = {
  business: PublicBusiness;
  slug: string;
  isCatalogPreview?: boolean;
};

export default async function PublicCatalogPageContent({
  business,
  slug,
  isCatalogPreview = false
}: PublicCatalogPageContentProps) {
  const [{ categories, products }, customizationEnabled] = await Promise.all([
    getPublicCatalogByBusinessId(business.id),
    isProductCustomizationEnabled(business.id)
  ]);

  let enrichedProducts = products;

  if (customizationEnabled && products.length > 0) {
    const summaries = await getPublicCustomizationSummariesForProducts({
      businessId: business.id,
      productIds: products.map((product) => product.id)
    });

    enrichedProducts = products.map((product) => {
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
  }

  return (
    <CatalogClient
      business={business}
      categories={categories}
      products={enrichedProducts}
      slug={slug}
      customizationEnabled={customizationEnabled}
      isCatalogPreview={isCatalogPreview}
    />
  );
}
