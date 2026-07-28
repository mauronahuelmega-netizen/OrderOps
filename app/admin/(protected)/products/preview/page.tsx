import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import CatalogPreviewShell from "@/components/admin/products/catalog-preview-shell";
import { buildCatalogPreviewPath } from "@/lib/admin/catalog-preview-shared";
import { requireAdminPermission } from "@/lib/admin/context";

export default async function AdminCatalogPreviewPage() {
  const adminContext = await requireAdminPermission("manageProducts");
  const businessSlug = adminContext.businessSlug?.trim().toLowerCase() || null;
  const hasValidSlug = Boolean(businessSlug && businessSlug.length > 0);

  return (
    <AdminPageLayout size="operational">
      <AdminPageHeader
        variant="operational"
        eyebrow="Catálogo"
        title="Vista previa del catálogo"
        description="Probá la experiencia móvil del catálogo público sin confirmar pedidos reales."
      />

      {!hasValidSlug || !businessSlug ? (
        <CatalogPreviewShell mode="empty" />
      ) : (
        <CatalogPreviewShell
          mode="preview"
          businessId={adminContext.businessId}
          businessSlug={businessSlug}
          iframeSrc={buildCatalogPreviewPath(businessSlug, "catalogo")}
        />
      )}
    </AdminPageLayout>
  );
}
