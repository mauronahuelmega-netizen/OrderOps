import CatalogClient from "@/components/public/catalog/catalog-client";
import type { PublicBusiness } from "@/lib/business/public";
import { getPublicCatalogPageData } from "@/lib/catalog/public-page-data";

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
  const { categories, products, productCustomizationEnabled } =
    await getPublicCatalogPageData(business);

  return (
    <CatalogClient
      business={business}
      categories={categories}
      products={products}
      slug={slug}
      customizationEnabled={productCustomizationEnabled}
      isCatalogPreview={isCatalogPreview}
    />
  );
}
