import PublicCatalogPageContent from "@/components/public/catalog/public-catalog-page";
import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";

type PublicCatalogMirrorPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicCatalogMirrorPage({
  params
}: PublicCatalogMirrorPageProps) {
  const { slug } = await params;
  const business = await getRequestPublicBusiness(slug);

  return <PublicCatalogPageContent business={business} slug={slug} />;
}
