import { notFound } from "next/navigation";
import CatalogClient from "@/components/public/catalog/catalog-client";
import { getPublicCatalogPageData } from "@/lib/catalog/public-page-data";

type PublicCatalogPageContentProps = {
  slug: string;
  isCatalogPreview?: boolean;
};

export default async function PublicCatalogPageContent({
  slug,
  isCatalogPreview = false
}: PublicCatalogPageContentProps) {
  const pageData = await getPublicCatalogPageData(slug);

  if (!pageData) {
    notFound();
  }

  return (
    <CatalogClient
      business={pageData.business}
      categories={pageData.categories}
      products={pageData.products}
      slug={slug}
      customizationEnabled={pageData.productCustomizationEnabled}
      isCatalogPreview={isCatalogPreview}
    />
  );
}
