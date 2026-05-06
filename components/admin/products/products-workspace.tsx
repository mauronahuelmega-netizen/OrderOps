"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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

  const catalogHref = businessSlug ? `/b/${businessSlug}/catalogo` : null;

  return (
    <div className="admin-products-page">
      <header className="admin-products-topbar">
        <div className="admin-products-topbar-copy">
          <p className="catalog-eyebrow">Productos</p>
          <h1>Productos</h1>
          <p>Administrá tu catálogo.</p>
        </div>

        <div className="admin-products-actions">
          <Button
            type="button"
            className="admin-primary-button"
            disabled={categories.length === 0}
            onClick={() => setIsProductOpen((current) => !current)}
            variant="primary"
          >
            {isProductOpen ? "Cerrar producto" : "+ Nuevo producto"}
          </Button>

          <Button
            type="button"
            className="admin-secondary-link admin-secondary-link--muted"
            onClick={() => setIsCategoryOpen((current) => !current)}
            variant="secondary"
          >
            {isCategoryOpen ? "Cerrar categoría" : "+ Nueva categoría"}
          </Button>

          {catalogHref ? (
            <Button href={catalogHref} className="admin-ghost-link" variant="ghost">
              Ver catálogo
            </Button>
          ) : null}
        </div>
      </header>

      {isProductOpen || isCategoryOpen ? (
        <section className="admin-products-creator-stack">
          {isProductOpen ? (
            <Card className="admin-form-card admin-products-inline-card">
              <CreateProductForm businessId={businessId} categories={categories} embedded />
            </Card>
          ) : null}

          {isCategoryOpen ? (
            <Card className="admin-form-card admin-products-inline-card">
              <CreateCategoryForm embedded />
            </Card>
          ) : null}
        </section>
      ) : null}

      <Card className="admin-form-card admin-products-catalog-card">
        <div className="admin-products-catalog-header">
          <div>
            <h2>Catálogo</h2>
            <p>Organizado por categorías.</p>
          </div>
        </div>

        <div className="admin-products-metrics">
          <span>{products.length} {products.length === 1 ? "producto" : "productos"}</span>
          <span>
            {categoriesWithProducts.length}{" "}
            {categoriesWithProducts.length === 1 ? "categoría" : "categorías"}
          </span>
          <span>{activeProductsCount} activos</span>
          {inactiveProductsCount > 0 ? (
            <span>{inactiveProductsCount} inactivos</span>
          ) : null}
        </div>

        {categories.length === 0 ? (
          <div className="admin-empty-state">
            <h2>Primero creá una categoría</h2>
            <p>Necesitás al menos una categoría para cargar productos.</p>
            <Button
              type="button"
              className="admin-secondary-link"
              onClick={() => setIsCategoryOpen(true)}
              variant="secondary"
            >
              Nueva categoría
            </Button>
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
            <Button
              type="button"
              className="admin-primary-button"
              onClick={() => setIsProductOpen(true)}
              variant="primary"
            >
              Nuevo producto
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
