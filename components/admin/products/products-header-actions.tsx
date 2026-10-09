"use client";

import { useCallback, useState } from "react";
import Button from "@/components/ui/Button";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import { buildPublicCatalogPath } from "@/lib/admin/catalog-preview-shared";
import styles from "./products-header-actions.module.css";

type ProductsHeaderActionsProps = {
  businessSlug: string | null;
};

export default function ProductsHeaderActions({ businessSlug }: ProductsHeaderActionsProps) {
  const { categoriesCount, flyoutMode, closeFlyout, openCreateProduct } = useProductsManagement();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const isProductOpen = flyoutMode === "create-product";
  const normalizedSlug = businessSlug?.trim().toLowerCase() || null;
  const publicCatalogPath = normalizedSlug ? buildPublicCatalogPath(normalizedSlug) : null;

  const handleCopyPublicLink = useCallback(async () => {
    if (!publicCatalogPath) {
      return;
    }

    setCopyStatus("idle");
    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicCatalogPath}`
        : publicCatalogPath;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2500);
    }
  }, [publicCatalogPath]);

  const copyLiveMessage =
    copyStatus === "copied"
      ? "Link del catálogo público copiado"
      : copyStatus === "error"
        ? "No se pudo copiar el link del catálogo público"
        : "";

  return (
    <div className={styles.actions}>
      <Button
        type="button"
        className={`admin-primary-button ${styles.primaryAction}`}
        disabled={categoriesCount === 0}
        onClick={() => (isProductOpen ? closeFlyout() : openCreateProduct())}
        variant="primary"
      >
        {isProductOpen ? "Cerrar producto" : "+ Nuevo producto"}
      </Button>

      <Button
        href="/admin/products/customizations"
        className={`admin-ghost-link ${styles.secondaryAction}`}
        variant="ghost"
        aria-label="Opcionales y extras"
      >
        <span className={styles.labelDesktop}>Opcionales y extras</span>
        <span className={styles.labelMobile}>Opcionales</span>
      </Button>

      {/* Desktop: admin preview shell. Hidden on <900 (display:none → out of a11y/tab). */}
      <Button
        href="/admin/products/preview"
        className={`admin-ghost-link ${styles.secondaryAction} ${styles.previewDesktop}`}
        variant="ghost"
      >
        Vista previa del catálogo
      </Button>

      {/* Mobile: real public catalog. Hidden on >=900. */}
      {publicCatalogPath ? (
        <Button
          href={publicCatalogPath}
          target="_blank"
          rel="noopener noreferrer"
          className={`admin-ghost-link ${styles.secondaryAction} ${styles.catalogMobile}`}
          variant="ghost"
          aria-label="Abrir catálogo público"
        >
          Abrir catálogo
        </Button>
      ) : (
        <Button
          type="button"
          className={`admin-ghost-link ${styles.secondaryAction} ${styles.catalogMobile}`}
          variant="ghost"
          disabled
          aria-label="Abrir catálogo público no disponible: falta dirección pública"
        >
          Abrir catálogo
        </Button>
      )}

      <Button
        type="button"
        className={`admin-ghost-link ${styles.secondaryAction} ${styles.copyAction}`}
        variant="ghost"
        disabled={!publicCatalogPath}
        aria-label={
          publicCatalogPath
            ? "Copiar link del catálogo público"
            : "Copiar link catálogo público no disponible: falta dirección pública"
        }
        onClick={handleCopyPublicLink}
      >
        {copyStatus === "copied" ? (
          <>
            <span className={styles.labelDesktop}>Link copiado</span>
            <span className={styles.labelMobile}>Copiado</span>
          </>
        ) : copyStatus === "error" ? (
          <>
            <span className={styles.labelDesktop}>No se pudo copiar</span>
            <span className={styles.labelMobile}>Error</span>
          </>
        ) : (
          <>
            <span className={styles.labelDesktop}>Copiar link catálogo público</span>
            <span className={styles.labelMobile}>Copiar link</span>
          </>
        )}
      </Button>

      <span className={styles.copyStatus} role="status" aria-live="polite">
        {copyLiveMessage}
      </span>
    </div>
  );
}
