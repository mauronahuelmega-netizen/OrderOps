"use client";

import Button from "@/components/ui/Button";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import styles from "./products-header-actions.module.css";

type ProductsHeaderActionsProps = {
  businessSlug: string | null;
};

export default function ProductsHeaderActions({ businessSlug }: ProductsHeaderActionsProps) {
  const { categoriesCount, flyoutMode, closeFlyout, openCreateProduct } = useProductsManagement();

  const isProductOpen = flyoutMode === "create-product";
  const catalogHref = businessSlug ? `/b/${businessSlug}/catalogo` : null;

  return (
    <div className={styles.actions}>
      <Button
        type="button"
        className="admin-primary-button"
        disabled={categoriesCount === 0}
        onClick={() => (isProductOpen ? closeFlyout() : openCreateProduct())}
        variant="primary"
      >
        {isProductOpen ? "Cerrar producto" : "+ Nuevo producto"}
      </Button>

      <Button
        href="/admin/products/customizations"
        className="admin-ghost-link"
        variant="ghost"
      >
        Opcionales y extras
      </Button>

      {catalogHref ? (
        <Button href={catalogHref} className="admin-ghost-link" variant="ghost">
          Ver catálogo
        </Button>
      ) : null}
    </div>
  );
}
