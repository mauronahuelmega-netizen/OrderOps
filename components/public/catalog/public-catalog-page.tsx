import CatalogClient from "@/components/public/catalog/catalog-client";
import type { PublicBusiness } from "@/lib/business/public";
import { getPublicCatalogByBusinessId } from "@/lib/catalog/public";

type PublicCatalogPageContentProps = {
  business: PublicBusiness;
  slug: string;
};

export default async function PublicCatalogPageContent({
  business,
  slug
}: PublicCatalogPageContentProps) {
  const { categories, products } = await getPublicCatalogByBusinessId(business.id);

  return (
    <CatalogClient
      business={business}
      categories={categories}
      products={products}
      slug={slug}
    />
  );
}
