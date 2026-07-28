import PublicCatalogPageContent from "@/components/public/catalog/public-catalog-page";
import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";
import { isCatalogPreviewQueryFlag } from "@/lib/admin/catalog-preview-shared";

type PublicCatalogMirrorPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    orderopsPreview?: string | string[];
  }>;
};

export default async function PublicCatalogMirrorPage({
  params,
  searchParams
}: PublicCatalogMirrorPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const business = await getRequestPublicBusiness(slug);
  const isCatalogPreview = isCatalogPreviewQueryFlag(resolvedSearchParams.orderopsPreview);

  return (
    <PublicCatalogPageContent
      business={business}
      slug={slug}
      isCatalogPreview={isCatalogPreview}
    />
  );
}
