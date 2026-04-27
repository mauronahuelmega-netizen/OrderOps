"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CreateCategoryForm from "@/components/admin/categories/create-category-form";
import CreateProductForm from "@/components/admin/products/create-product-form";
import ProductCatalogPanel from "@/components/admin/products/product-catalog-panel";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProduct } from "@/lib/products/admin";

type ProductsWorkspaceProps = {
  businessId: string;
  businessSlug: string | null;
  categories: AdminCategory[];
  products: AdminProduct[];
};

export default function ProductsWorkspace({
  businessId,
  businessSlug,
  categories,
  products
}: ProductsWorkspaceProps) {
  const [isProductOpen, setIsProductOpen] = useState(categories.length > 0 && products.length === 0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(categories.length === 0);

  const categoriesWithProducts = useMemo(
    () => categories.filter((category) => products.some((product) => product.category_id === category.id)),
    [categories, products]
  );

  const activeProductsCount = useMemo(
    () => products.filter((product) => product.is_available).length,
    [products]
  );

  const inactiveProductsCount = products.length - activeProductsCount;

  const catalogHref = businessSlug ? `/b/${businessSlug}` : null;

  return (
    <div className="admin-products-page">
      <header className="admin-products-topbar">
        <div className="admin-products-topbar-copy">
          <p className="catalog-eyebrow">Productos</p>
          <h1>Productos</h1>
          <p>Administra tu catálogo.</p>
        </div>

        <div className="admin-products-actions">
          <button
            type="button"
            className="admin-primary-button"
            disabled={categories.length === 0}
            onClick={() => setIsProductOpen((current) => !current)}
          >
            {isProductOpen ? "Cerrar producto" : "+ Nuevo producto"}
          </button>

          <button
            type="button"
            className="admin-secondary-link admin-secondary-link--muted"
            onClick={() => setIsCategoryOpen((current) => !current)}
          >
            {isCategoryOpen ? "Cerrar categoría" : "+ Nueva categoría"}
          </button>

          {catalogHref ? (
            <Link href={catalogHref} className="admin-ghost-link">
              Ver catálogo
            </Link>
          ) : null}
        </div>
      </header>

      {isProductOpen || isCategoryOpen ? (
        <section className="admin-products-creator-stack">
          {isProductOpen ? (
            <div className="admin-form-card admin-products-inline-card">
              <CreateProductForm businessId={businessId} categories={categories} embedded />
            </div>
          ) : null}

          {isCategoryOpen ? (
            <div className="admin-form-card admin-products-inline-card">
              <CreateCategoryForm embedded />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="admin-form-card admin-products-catalog-card">
        <div className="admin-products-catalog-header">
          <div>
            <h2>Catálogo</h2>
            <p>Organizado por categorías.</p>
          </div>
        </div>

        <div className="admin-products-metrics">
          <span>{products.length} {products.length === 1 ? "producto" : "productos"}</span>
          <span>{categoriesWithProducts.length} {categoriesWithProducts.length === 1 ? "categoría" : "categorías"}</span>
          <span>{activeProductsCount} activos</span>
          {inactiveProductsCount > 0 ? (
            <span>{inactiveProductsCount} inactivos</span>
          ) : null}
        </div>

        {categories.length === 0 ? (
          <div className="admin-empty-state">
            <h2>Primero crea una categoría</h2>
            <p>Necesitás al menos una categoría para cargar productos.</p>
            <button
              type="button"
              className="admin-secondary-link"
              onClick={() => setIsCategoryOpen(true)}
            >
              Nueva categoría
            </button>
          </div>
        ) : products.length > 0 ? (
          <ProductCatalogPanel
            businessId={businessId}
            categories={categories}
            products={products}
          />
        ) : (
          <div className="admin-empty-state">
            <h2>Todavía no hay productos cargados</h2>
            <p>Creá tu primer producto para empezar a mostrarlo en el catálogo.</p>
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setIsProductOpen(true)}
            >
              Nuevo producto
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
