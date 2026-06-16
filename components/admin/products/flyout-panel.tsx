"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import ProductFormSkeleton from "@/components/admin/products/product-form-skeleton";
import Button from "@/components/ui/Button";
import formStyles from "@/components/admin/products/product-form.module.css";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import styles from "./flyout-panel.module.css";

const CreateProductForm = dynamic(
  () => import("@/components/admin/products/create-product-form"),
  { ssr: false }
);

const CreateCategoryForm = dynamic(
  () => import("@/components/admin/categories/create-category-form"),
  { ssr: false }
);

const EditProductForm = dynamic(
  () => import("@/components/admin/products/edit-product-form"),
  { ssr: false }
);

function resolveFlyoutTitle(
  flyoutMode: ReturnType<typeof useProductsManagement>["flyoutMode"],
  selectedProductName: string,
  selectedProduct: ReturnType<typeof useProductsManagement>["selectedProduct"]
) {
  if (flyoutMode === "create-product") {
    return "Nuevo producto";
  }

  if (flyoutMode === "create-category") {
    return "Nueva categoría";
  }

  if (flyoutMode === "edit") {
    return selectedProduct?.name ?? selectedProductName;
  }

  return "Producto";
}

function resolveFlyoutEyebrow(
  flyoutMode: ReturnType<typeof useProductsManagement>["flyoutMode"]
) {
  if (flyoutMode === "create-product") {
    return "Alta";
  }

  if (flyoutMode === "create-category") {
    return "Categoría";
  }

  if (flyoutMode === "edit") {
    return "Editar producto";
  }

  return "";
}

export default function FlyoutPanel() {
  const {
    businessId,
    categories,
    flyoutMode,
    selectedProductName,
    selectedProduct,
    isLoadingSelectedProduct,
    selectedProductError,
    closeFlyout
  } = useProductsManagement();

  const isOpen = flyoutMode !== null;
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setIsPanelVisible(false);
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setIsPanelVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const panelClassName = isPanelVisible
    ? `${styles.panel} ${styles.panelOpen}`
    : styles.panel;

  return (
    <>
      <div className={styles.backdrop} onClick={closeFlyout} aria-hidden="false" />

      <section
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-flyout-title"
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>{resolveFlyoutEyebrow(flyoutMode)}</p>
            <h2 id="admin-product-flyout-title" className={styles.title}>
              {resolveFlyoutTitle(flyoutMode, selectedProductName, selectedProduct)}
            </h2>
          </div>

          <Button
            type="button"
            className="admin-secondary-link admin-secondary-link--compact"
            onClick={closeFlyout}
            variant="secondary"
          >
            Cerrar
          </Button>
        </header>

        <div className={styles.body}>
          {flyoutMode === "create-product" ? (
            <CreateProductForm businessId={businessId} categories={categories} embedded />
          ) : null}

          {flyoutMode === "create-category" ? <CreateCategoryForm embedded /> : null}

          {flyoutMode === "edit" ? (
            <>
              {isLoadingSelectedProduct ? (
                <div
                  className={`${formStyles.formRoot} ${formStyles.formShell} ${formStyles.shell}`}
                  aria-busy="true"
                  aria-label="Cargando producto"
                >
                  <ProductFormSkeleton />
                </div>
              ) : null}

              {selectedProductError ? (
                <p className="admin-feedback admin-feedback--error" role="alert">
                  {selectedProductError}
                </p>
              ) : null}

              {selectedProduct ? (
                <EditProductForm
                  businessId={businessId}
                  categories={categories}
                  product={selectedProduct}
                  inModal
                  onSuccess={closeFlyout}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
