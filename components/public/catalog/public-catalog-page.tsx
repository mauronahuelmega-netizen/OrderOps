import CatalogClient from "@/components/public/catalog/catalog-client";
import { requirePublicBusinessBySlug } from "@/lib/business/public";
import { getPublicCatalogByBusinessId } from "@/lib/catalog/public";

type PublicCatalogPageContentProps = {
  slug: string;
};

export default async function PublicCatalogPageContent({
  slug
}: PublicCatalogPageContentProps) {
  const business = await requirePublicBusinessBySlug(slug);
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
