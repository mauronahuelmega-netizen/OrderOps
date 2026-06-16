import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import DashboardShell from "@/components/admin/products/dashboard-shell";
import { ProductsToolbarSkeleton } from "@/components/admin/products/products-toolbar";
import ProductCatalogSkeleton from "@/components/admin/products/product-catalog-skeleton";

export default function AdminProductsLoading() {
  return (
    <AdminPageLayout size="operational">
      <AdminPageHeader
        variant="operational"
        eyebrow="Catálogo"
        title="Productos"
        description="Gestioná el catálogo público y la disponibilidad operativa."
      />

      <DashboardShell toolbar={<ProductsToolbarSkeleton />}>
        <ProductCatalogSkeleton />
      </DashboardShell>
    </AdminPageLayout>
  );
}
