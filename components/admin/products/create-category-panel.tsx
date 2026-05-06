"use client";

import { useState } from "react";
import CreateCategoryForm from "@/components/admin/categories/create-category-form";

export default function CreateCategoryPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="admin-form-card admin-products-create-panel">
      <div className="admin-section-heading">
        <div className="admin-form-header">
          <h2>Categorías</h2>
          <p>Creá categorías sin salir de la gestión de productos.</p>
        </div>

        <button
          type="button"
          className="admin-secondary-link"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Cerrar" : "Nueva categoría"}
        </button>
      </div>

      {isOpen ? (
        <CreateCategoryForm embedded />
      ) : (
        <div className="admin-collapsed-helper">
          <p>Abrí esta sección si necesitás crear una categoría nueva.</p>
        </div>
      )}
    </section>
  );
}
