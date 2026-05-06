"use client";

import { useState } from "react";
import Link from "next/link";
import CreateProductForm from "@/components/admin/products/create-product-form";
import type { AdminCategory } from "@/lib/categories/admin";

type CreateProductPanelProps = {
  businessId: string;
  categories: AdminCategory[];
};

export default function CreateProductPanel({
  businessId,
  categories
}: CreateProductPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="admin-form-card admin-products-create-panel">
      <div className="admin-section-heading">
        <div className="admin-form-header">
          <h2>Productos</h2>
          <p>Gestioná el catálogo visible para tus clientes y mantenelo al día.</p>
        </div>

        {categories.length > 0 ? (
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? "Cerrar formulario" : "Nuevo producto"}
          </button>
        ) : null}
      </div>

      {categories.length === 0 ? (
        <div className="admin-empty-state">
          <h2>Primero creá una categoría</h2>
          <p>Necesitás al menos una categoría para poder cargar productos.</p>
          <Link href="/admin/categories" className="admin-secondary-link">
            Ir a categorías
          </Link>
        </div>
      ) : isOpen ? (
        <CreateProductForm businessId={businessId} categories={categories} embedded />
      ) : (
        <div className="admin-collapsed-helper">
          <p>Abrí el formulario cuando quieras cargar un nuevo producto.</p>
        </div>
      )}
    </section>
  );
}
