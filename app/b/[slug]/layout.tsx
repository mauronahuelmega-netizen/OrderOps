import PublicBusinessHeader from "@/components/public/business/public-business-header";
import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";

type PublicBusinessLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}>;

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
