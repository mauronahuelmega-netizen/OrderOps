"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import ProductFormSkeleton from "@/components/admin/products/product-form-skeleton";
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

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

function getFlyoutFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.tabIndex !== -1 &&
      element.getClientRects().length > 0
  );
}

function isImageCropModalOpen() {
  return Boolean(document.getElementById("image-crop-modal-title"));
}

function getOpenEditProductConfirmDialog() {
  const openConfirm = document.querySelector(
    'dialog[data-edit-product-confirm="true"][open]'
  );
  return openConfirm instanceof HTMLDialogElement ? openConfirm : null;
}

function isEditProductConfirmOpen() {
  return Boolean(getOpenEditProductConfirmDialog());
}

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
    closeFlyout,
    requestCloseFlyout
  } = useProductsManagement();

  const isOpen = flyoutMode !== null;
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    if (!isOpen || !isPanelVisible) {
      return;
    }

    closeButtonRef.current?.focus();
  }, [isOpen, isPanelVisible, flyoutMode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isImageCropModalOpen()) {
          return;
        }

        if (isEditProductConfirmOpen()) {
          event.preventDefault();
          event.stopPropagation();
          getOpenEditProductConfirmDialog()?.close();
          return;
        }

        event.preventDefault();
        requestCloseFlyout();
        return;
      }

      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (isImageCropModalOpen() || isEditProductConfirmOpen()) {
        return;
      }

      const focusables = getFlyoutFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const activeIsInside = active instanceof HTMLElement && dialog.contains(active);

      if (event.shiftKey) {
        if (!activeIsInside || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeIsInside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, requestCloseFlyout]);

  if (!isOpen) {
    return null;
  }

  const panelClassName = isPanelVisible
    ? `${styles.panel} ${styles.panelOpen}`
    : styles.panel;

  function handleBackdropClick() {
    if (isImageCropModalOpen() || isEditProductConfirmOpen()) {
      return;
    }

    requestCloseFlyout();
  }

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <section
        ref={dialogRef}
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

          <button
            ref={closeButtonRef}
            type="button"
            className={`ui-button ui-button--secondary admin-secondary-link admin-secondary-link--compact ${styles.closeButton}`}
            onClick={requestCloseFlyout}
          >
            Cerrar
          </button>
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
                  key={selectedProduct.id}
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
