import { requirePublicBusinessBySlug } from "@/lib/business/public";
import { getPublicCatalogByBusinessId } from "@/lib/catalog/public";
import CatalogClient from "@/components/public/catalog/catalog-client";

type PublicCatalogPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicCatalogPage({
  params
}: PublicCatalogPageProps) {
  const { slug } = await params;
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
