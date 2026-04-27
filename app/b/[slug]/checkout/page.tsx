import { requirePublicBusinessBySlug } from "@/lib/business/public";
import CheckoutClient from "@/components/public/checkout/checkout-client";

type CheckoutPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const business = await requirePublicBusinessBySlug(slug);

  return <CheckoutClient business={business} slug={slug} />;
}
