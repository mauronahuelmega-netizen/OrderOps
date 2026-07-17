import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import OwnerCustomizationBuilder from "@/components/admin/product-customization/owner-customization-builder";
import { requireAdminPermission } from "@/lib/admin/context";
import { getAdminCategories } from "@/lib/categories/admin";
import {
  getCustomizationAdminConfig,
  suggestNextAssignmentSortOrder,
  suggestNextGroupSortOrder,
  suggestNextUpsellSortOrder
} from "@/lib/product-customization/admin";
import { isProductCustomizationEnabled } from "@/lib/product-customization/flags";

type PageProps = {
  searchParams?: Promise<{ product?: string }>;
};

export default async function AdminProductCustomizationsPage({ searchParams }: PageProps) {
  const adminContext = await requireAdminPermission("manageProducts");
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const focusProductId =
    typeof resolvedSearchParams.product === "string"
      ? resolvedSearchParams.product.trim()
      : "";

  const [config, categories, customizationEnabled] = await Promise.all([
    getCustomizationAdminConfig(adminContext.businessId),
    getAdminCategories(adminContext.businessId),
    isProductCustomizationEnabled(adminContext.businessId)
  ]);

  const { groups, assignments, upsellGroups, products } = config;
  const nextGroupSort = suggestNextGroupSortOrder(groups);
  const nextAssignmentSort = suggestNextAssignmentSortOrder(assignments);
  const nextUpsellSort = suggestNextUpsellSortOrder(upsellGroups);

  return (
    <AdminPageLayout size="wide">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Opcionales, extras y plus"
        description="Configurá qué puede elegir el cliente antes de agregar un producto al carrito. También podés sugerir productos extra para aumentar el ticket promedio."
      />

      <OwnerCustomizationBuilder
        customizationEnabled={customizationEnabled}
        initialProductId={focusProductId}
        groups={groups}
        categories={categories}
        products={products}
        assignments={assignments}
        upsellGroups={upsellGroups}
        nextGroupSort={nextGroupSort}
        nextAssignmentSort={nextAssignmentSort}
        nextUpsellSort={nextUpsellSort}
      />
    </AdminPageLayout>
  );
}
