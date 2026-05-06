import BusinessLandingPage from "@/components/public/business/business-landing-page";
import { requirePublicBusinessBySlug } from "@/lib/business/public";

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

  return <BusinessLandingPage business={business} slug={slug} />;
}
