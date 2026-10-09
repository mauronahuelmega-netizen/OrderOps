"use client";

import { useSearchParams } from "next/navigation";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/Button";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import tableStyles from "@/components/admin/products/product-table-view.module.css";

type ProductCatalogEmptyStateProps = {
  /** Non-archived product count for the tenant (ignores list filters). */
  activeLifecycleCount: number;
  status?: string;
  q?: string;
  categoryId?: string;
  stock?: string;
};

/**
 * Empty collection owner. Distinguishes:
 * - only-archived tenant (default view, catalog still exists)
 * - filtered-zero (recover via toolbar Limpiar filtros)
 * - archived view with no matches
 */
export default function ProductCatalogEmptyState({
  activeLifecycleCount,
  status,
  q,
  categoryId,
  stock
}: ProductCatalogEmptyStateProps) {
  const { openCreateProduct, catalogTotalCount } = useProductsManagement();
  const searchParams = useSearchParams();
  const isDefaultLifecycleView = !status;
  const onlyArchivedRemain =
    isDefaultLifecycleView &&
    !q &&
    !categoryId &&
    !stock &&
    catalogTotalCount > 0 &&
    activeLifecycleCount === 0;

  if (onlyArchivedRemain) {
    const archivedHref = (() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("status", "archived");
      params.delete("page");
      const query = params.toString();
      return query ? `/admin/products?${query}` : "/admin/products?status=archived";
    })();

    return (
      <div className={tableStyles.dataSurface}>
        <EmptyState
          className={tableStyles.emptyStateInner}
          title="No hay productos activos en tu catálogo."
          description="Puedes restaurar un producto archivado o crear uno nuevo."
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
            padding: "0 1rem 1.5rem"
          }}
        >
          <Button href={archivedHref} variant="secondary">
            Ver archivados
          </Button>
          <Button type="button" variant="primary" onClick={openCreateProduct}>
            Crear producto
          </Button>
        </div>
      </div>
    );
  }

  if (status === "archived" && !q && !categoryId && !stock) {
    return (
      <div className={tableStyles.dataSurface}>
        <EmptyState
          className={tableStyles.emptyStateInner}
          title="No hay productos archivados"
          description="Los productos que archives aparecerán aquí para restaurarlos o eliminarlos."
        />
      </div>
    );
  }

  return (
    <div className={tableStyles.dataSurface}>
      <EmptyState
        className={tableStyles.emptyStateInner}
        title="No se encontraron productos"
        description="Ningún producto coincide con los filtros actuales. Limpiá los filtros de la barra de búsqueda para ver el catálogo completo."
      />
    </div>
  );
}
