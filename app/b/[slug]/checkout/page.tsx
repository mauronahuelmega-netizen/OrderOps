import { requirePublicBusinessBySlug } from "@/lib/business/public";
import CheckoutClient from "@/components/public/checkout/checkout-client";
import { isCatalogPreviewQueryFlag } from "@/lib/admin/catalog-preview-shared";

type CheckoutPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    orderopsPreview?: string | string[];
  }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const business = await requirePublicBusinessBySlug(slug);
  const isCatalogPreview = isCatalogPreviewQueryFlag(resolvedSearchParams.orderopsPreview);

  return (
    <CheckoutClient
      business={business}
      slug={slug}
      isCatalogPreview={isCatalogPreview}
    />
  );
}
