import { Suspense } from "react";
import DashboardShell from "@/components/admin/products/dashboard-shell";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import FlyoutPanel from "@/components/admin/products/flyout-panel";
import ProductCatalogSection from "@/components/admin/products/product-catalog-section";
import ProductCatalogSkeleton from "@/components/admin/products/product-catalog-skeleton";
import ProductsHeaderActions from "@/components/admin/products/products-header-actions";
import ProductsToolbar from "@/components/admin/products/products-toolbar";
import { ProductsManagementProvider } from "@/components/admin/products/products-management-provider";
import { requireAdminPermission } from "@/lib/admin/context";
import { getAdminCategories } from "@/lib/categories/admin";
import { getAdminProducts, parseAdminProductsPageParam } from "@/lib/products/admin";

type AdminProductsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    categoryId?: string;
    stock?: string;
    status?: string;
  }>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const adminContext = await requireAdminPermission("manageProducts");
  const resolvedSearchParams = await searchParams;
  const page = parseAdminProductsPageParam(resolvedSearchParams.page);
  const q = resolvedSearchParams.q?.trim() || undefined;
  const categoryId = resolvedSearchParams.categoryId || undefined;
  const stock = resolvedSearchParams.stock || undefined;
  const status = resolvedSearchParams.status || undefined;
  const filterOptions = { q, categoryId, stock, status };
  const catalogKey = [page, q, categoryId, stock, status].join("-");

  const [categories, productsSummary] = await Promise.all([
    getAdminCategories(adminContext.businessId),
    getAdminProducts(adminContext.businessId, { page: 1, limit: 1, ...filterOptions })
  ]);

  return (
    <ProductsManagementProvider
      initialData={{
        businessId: adminContext.businessId,
        categories,
        totalCount: productsSummary.totalCount
      }}
    >
      <AdminPageLayout size="operational">
        <AdminPageHeader
          variant="operational"
          eyebrow="Catálogo"
          title="Productos"
          description="Gestioná el catálogo público y la disponibilidad operativa."
          actions={<ProductsHeaderActions businessSlug={adminContext.businessSlug} />}
        />

        <DashboardShell
          toolbar={<ProductsToolbar />}
          flyout={<FlyoutPanel />}
        >
          <Suspense key={catalogKey} fallback={<ProductCatalogSkeleton />}>
            <ProductCatalogSection
              businessId={adminContext.businessId}
              categories={categories}
              page={page}
              q={q}
              categoryId={categoryId}
              stock={stock}
              status={status}
            />
          </Suspense>
        </DashboardShell>
      </AdminPageLayout>
    </ProductsManagementProvider>
  );
}
