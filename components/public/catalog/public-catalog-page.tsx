import { notFound } from "next/navigation";
import CatalogClient from "@/components/public/catalog/catalog-client";
import PublicCatalogObservability from "@/components/public/catalog/public-catalog-observability";
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
    <>
      <PublicCatalogObservability
        businessSlug={pageData.business.slug}
        isPreview={isCatalogPreview}
      />
      <CatalogClient
        business={pageData.business}
        categories={pageData.categories}
        products={pageData.products}
        slug={slug}
        copyrightYear={new Date().getFullYear()}
        customizationEnabled={pageData.productCustomizationEnabled}
        isCatalogPreview={isCatalogPreview}
      />
    </>
  );
}
