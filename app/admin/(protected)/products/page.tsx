import ProductsWorkspace from "@/components/admin/products/products-workspace";
import { requireAdminContext } from "@/lib/admin/context";
import { getAdminCategories } from "@/lib/categories/admin";
import { getAdminProducts } from "@/lib/products/admin";

export default async function AdminProductsPage() {
  const adminContext = await requireAdminContext();
  const [categories, products] = await Promise.all([
    getAdminCategories(adminContext.businessId),
    getAdminProducts(adminContext.businessId)
  ]);

  return (
    <ProductsWorkspace
      businessId={adminContext.businessId}
      businessSlug={adminContext.businessSlug}
      categories={categories}
      products={products}
    />
  );
}
