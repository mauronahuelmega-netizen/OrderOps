import { redirect } from "next/navigation";
import PublicBusinessFallbackHome from "@/components/public/business/public-business-fallback-home";
import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";
import { hasReadyPublicCatalog } from "@/lib/business/public-catalog-readiness";
import { buildPublicBusinessInquiryWhatsappUrl } from "@/lib/whatsapp/public";

type PublicBusinessEntryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildCatalogEntryPath(
  slug: string,
  searchParams: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          query.append(key, item);
        }
      }
    }
  }

  const qs = query.toString();
  return `/b/${slug}/catalogo${qs ? `?${qs}` : ""}`;
}

export default async function PublicBusinessEntryPage({
  params,
  searchParams
}: PublicBusinessEntryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const business = await getRequestPublicBusiness(slug);
  const catalogReady = await hasReadyPublicCatalog(business.id);

  if (catalogReady) {
    redirect(buildCatalogEntryPath(slug, resolvedSearchParams));
  }

  const whatsappUrl = buildPublicBusinessInquiryWhatsappUrl({
    businessName: business.name,
    whatsappNumber: business.whatsapp_number
  });

  return (
    <PublicBusinessFallbackHome
      businessName={business.name}
      logoUrl={business.logo_url}
      whatsappUrl={whatsappUrl}
    />
  );
}
