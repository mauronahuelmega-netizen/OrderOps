"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EditProductForm from "@/components/admin/products/edit-product-form";
import ProductCard from "@/components/admin/products/product-card";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProduct } from "@/lib/products/admin";

type ProductCatalogPanelProps = {
  businessId: string;
  categories: AdminCategory[];
  products: AdminProduct[];
};

export default function ProductCatalogPanel({
  businessId,
  categories,
  products
}: ProductCatalogPanelProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const categorySections = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          products: products
            .filter((product) => product.category_id === category.id)
            .sort((left, right) => {
              if (left.is_available !== right.is_available) {
                return left.is_available ? -1 : 1;
              }

              return left.name.localeCompare(right.name, "es-AR");
            })
        }))
        .filter((section) => section.products.length > 0),
    [categories, products]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  return (
    <>
      <div className="admin-product-category-groups">
        {categorySections.map(({ category, products: groupedProducts }) => (
          <Card key={category.id} className="admin-product-category-section">
            <div className="admin-product-category-section-header">
              <div>
                <h2>{category.name}</h2>
                <p>{groupedProducts.length} {groupedProducts.length === 1 ? "producto" : "productos"}</p>
              </div>
            </div>

            <div className="admin-product-card-grid">
              {groupedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => setSelectedProductId(product.id)}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {selectedProduct ? (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-modal-title"
        >
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <p className="catalog-eyebrow">Editar producto</p>
                <h2 id="admin-product-modal-title">{selectedProduct.name}</h2>
              </div>

              <Button
                type="button"
                className="admin-secondary-link admin-secondary-link--compact"
                onClick={() => setSelectedProductId(null)}
                variant="secondary"
              >
                Cerrar
              </Button>
            </div>

            <EditProductForm
              businessId={businessId}
              categories={categories}
              product={selectedProduct}
              inModal
              onSuccess={() => setSelectedProductId(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
