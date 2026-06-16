"use client";

import Button from "@/components/ui/Button";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";

type ProductEmptyStateActionsProps = {
  variant: "categories" | "products";
};

export default function ProductEmptyStateActions({ variant }: ProductEmptyStateActionsProps) {
  const { openCreateCategory, openCreateProduct } = useProductsManagement();

  if (variant === "categories") {
    return (
      <Button
        type="button"
        className="admin-secondary-link"
        onClick={openCreateCategory}
        variant="secondary"
      >
        Nueva categoría
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className="admin-primary-button"
      onClick={openCreateProduct}
      variant="primary"
    >
      Nuevo producto
    </Button>
  );
}
