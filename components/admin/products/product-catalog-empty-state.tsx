"use client";

import { usePathname, useRouter } from "next/navigation";
import EmptyState from "@/components/ui/empty-state";
import tableStyles from "@/components/admin/products/product-table-view.module.css";

export default function ProductCatalogEmptyState() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={tableStyles.dataSurface}>
      <EmptyState
        className={tableStyles.emptyStateInner}
        title="No se encontraron productos"
        description="No hay resultados que coincidan con tus filtros actuales."
        actionLabel="Limpiar filtros"
        onAction={() => {
          router.push(pathname);
        }}
      />
    </div>
  );
}
