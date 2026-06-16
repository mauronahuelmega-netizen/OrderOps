import ProductCatalogViews from "@/components/admin/products/product-catalog-views";
import ProductCatalogEmptyState from "@/components/admin/products/product-catalog-empty-state";
import { getAdminProducts } from "@/lib/products/admin";
import type { AdminCategory } from "@/lib/categories/admin";

type ProductCatalogSectionProps = {
  businessId: string;
  categories: AdminCategory[];
  page: number;
  q?: string;
  categoryId?: string;
  stock?: string;
  status?: string;
};

export default async function ProductCatalogSection({
  businessId,
  categories,
  page,
  q,
  categoryId,
  stock,
  status
}: ProductCatalogSectionProps) {
  const productsPage = await getAdminProducts(businessId, {
    page,
    q,
    categoryId,
    stock,
    status
  });

  if (productsPage.products.length === 0) {
    return <ProductCatalogEmptyState />;
  }

  return (
    <ProductCatalogViews
      categories={categories}
      products={productsPage.products}
      pagination={{
        page: productsPage.page,
        limit: productsPage.limit,
        totalCount: productsPage.totalCount,
        totalPages: productsPage.totalPages
      }}
    />
  );
}
