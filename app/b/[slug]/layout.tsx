import PublicBusinessHeader from "@/components/public/business/public-business-header";
import { requirePublicBusinessBySlug } from "@/lib/business/public";

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
  const business = await requirePublicBusinessBySlug(slug);

  return (
    <div className="public-business-layout">
      <PublicBusinessHeader business={business} slug={slug} />
      <div className="public-business-layout__content">{children}</div>
    </div>
  );
}
