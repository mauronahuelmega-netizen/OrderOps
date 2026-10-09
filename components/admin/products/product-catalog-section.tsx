import ProductCatalogViews from "@/components/admin/products/product-catalog-views";
import ProductCatalogEmptyState from "@/components/admin/products/product-catalog-empty-state";
import {
  getAdminProducts,
  getAdminProductsActiveLifecycleCount
} from "@/lib/products/admin";
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
  const [productsPage, activeLifecycleCount] = await Promise.all([
    getAdminProducts(businessId, {
      page,
      q,
      categoryId,
      stock,
      status
    }),
    getAdminProductsActiveLifecycleCount(businessId)
  ]);

  if (productsPage.products.length === 0) {
    return (
      <ProductCatalogEmptyState
        activeLifecycleCount={activeLifecycleCount}
        status={status}
        q={q}
        categoryId={categoryId}
        stock={stock}
      />
    );
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
