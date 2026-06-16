import BusinessLandingPage from "@/components/public/business/business-landing-page";
import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";

type PublicCatalogPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicCatalogPage({
  params
}: PublicCatalogPageProps) {
  const { slug } = await params;
  const business = await getRequestPublicBusiness(slug);

  return <BusinessLandingPage business={business} slug={slug} />;
}
