"use client";

import { useState } from "react";
import CreateCategoryForm from "@/components/admin/categories/create-category-form";

export default function CreateCategoryPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="admin-form-card admin-products-create-panel">
      <div className="admin-section-heading">
        <div className="admin-form-header">
          <h2>Categorias</h2>
          <p>Crea categorias sin salir de la gestion de productos.</p>
        </div>

        <button
          type="button"
          className="admin-secondary-link"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Cerrar" : "Nueva categoria"}
        </button>
      </div>

      {isOpen ? (
        <CreateCategoryForm embedded />
      ) : (
        <div className="admin-collapsed-helper">
          <p>Abre esta seccion si necesitas crear una categoria nueva.</p>
        </div>
      )}
    </section>
  );
}
