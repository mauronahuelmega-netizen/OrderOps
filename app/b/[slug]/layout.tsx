import type { Metadata } from "next";
import PublicBusinessHeader from "@/components/public/business/public-business-header";
import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";

type PublicBusinessLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}>;

const ORDEROPS_FALLBACK_BROWSER_ICONS = {
  icon: [
    { url: "/favicon.ico?v=2", type: "image/x-icon" },
    { url: "/icon.png?v=2", type: "image/png", sizes: "192x192" }
  ],
  shortcut: [{ url: "/favicon.ico?v=2" }]
} satisfies Metadata["icons"];

function buildTenantBrowserIcons(
  logoUrl: string | null | undefined
): Metadata["icons"] {
  const normalizedLogoUrl = logoUrl?.trim();

  if (normalizedLogoUrl) {
    return {
      icon: [{ url: normalizedLogoUrl }],
      shortcut: [{ url: normalizedLogoUrl }]
    };
  }

  return ORDEROPS_FALLBACK_BROWSER_ICONS;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getRequestPublicBusiness(slug);

  return {
    title: business.name,
    icons: buildTenantBrowserIcons(business.logo_url)
  };
}

export default async function PublicBusinessLayout({
  children,
  params
}: PublicBusinessLayoutProps) {
  const { slug } = await params;
  const business = await getRequestPublicBusiness(slug);

  return (
    <div className="public-business-layout">
      <PublicBusinessHeader business={business} slug={slug} />
      <div className="public-business-layout__content">{children}</div>
    </div>
  );
}
