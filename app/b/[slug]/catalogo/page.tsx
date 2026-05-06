import PublicCatalogPageContent from "@/components/public/catalog/public-catalog-page";

type PublicCatalogMirrorPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicCatalogMirrorPage({
  params
}: PublicCatalogMirrorPageProps) {
  const { slug } = await params;

  return <PublicCatalogPageContent slug={slug} />;
}
