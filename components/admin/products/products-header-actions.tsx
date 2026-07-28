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

      <Button
        href="/admin/products/preview"
        className="admin-ghost-link"
        variant="ghost"
      >
        Vista previa del catálogo
      </Button>

      <Button
        type="button"
        className="admin-ghost-link"
        variant="ghost"
        disabled={!publicCatalogPath}
        aria-label={
          publicCatalogPath
            ? "Copiar link catálogo público"
            : "Copiar link catálogo público no disponible: falta dirección pública"
        }
        onClick={handleCopyPublicLink}
      >
        {copyStatus === "copied"
          ? "Link copiado"
          : copyStatus === "error"
            ? "No se pudo copiar"
            : "Copiar link catálogo público"}
      </Button>
    </div>
  );
}
