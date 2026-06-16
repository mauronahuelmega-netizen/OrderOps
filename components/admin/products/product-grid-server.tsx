import { Suspense } from "react";
import Card from "@/components/ui/Card";
import ProductCard from "@/components/admin/products/product-card";
import ProductEmptyStateActions from "@/components/admin/products/product-empty-state-actions";
import ProductPagination from "@/components/admin/products/product-pagination";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProductListItem } from "@/lib/products/admin";
import {
  buildCategorySections,
  computeCatalogMetrics,
  countCategoriesWithProducts
} from "@/lib/products/selectors";
import gridStyles from "./product-grid.module.css";

type ProductGridPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

type ProductGridServerProps = {
  categories: AdminCategory[];
  products: AdminProductListItem[];
  pagination: ProductGridPagination;
};

export default function ProductGridServer({
  categories,
  products,
  pagination
}: ProductGridServerProps) {
  const { page, limit, totalCount, totalPages } = pagination;
  const categorySections = buildCategorySections(categories, products);
  const categoriesWithProductsOnPage = countCategoriesWithProducts(categories, products);
  const { activeProductsOnPage, inactiveProductsOnPage } = computeCatalogMetrics(products);

  return (
    <Card className={`admin-form-card ${gridStyles.catalogCard}`}>
      <div className={gridStyles.catalogHeader}>
        <h2 className={gridStyles.catalogTitle}>Catálogo</h2>
        <p className={gridStyles.catalogSubtitle}>Por categorías</p>
      </div>

      <div className={gridStyles.metrics}>
        <span>
          {totalCount} {totalCount === 1 ? "producto" : "productos"}
        </span>
        {products.length > 0 ? (
          <>
            <span className={gridStyles.metricsDot} aria-hidden="true">
              ·
            </span>
            <span>
              {categoriesWithProductsOnPage}{" "}
              {categoriesWithProductsOnPage === 1 ? "categoría" : "categorías"}
            </span>
            <span className={gridStyles.metricsDot} aria-hidden="true">
              ·
            </span>
            <span>{activeProductsOnPage} activos</span>
            {inactiveProductsOnPage > 0 ? (
              <>
                <span className={gridStyles.metricsDot} aria-hidden="true">
                  ·
                </span>
                <span>{inactiveProductsOnPage} inactivos</span>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {categories.length === 0 ? (
        <div className="admin-empty-state">
          <h2>Primero creá una categoría</h2>
          <p>Necesitás al menos una categoría para cargar productos.</p>
          <ProductEmptyStateActions variant="categories" />
        </div>
      ) : totalCount === 0 ? (
        <div className="admin-empty-state">
          <h2>Todavía no hay productos cargados</h2>
          <p>Creá tu primer producto para empezar a mostrarlo en el catálogo.</p>
          <ProductEmptyStateActions variant="products" />
        </div>
      ) : products.length > 0 ? (
        <>
          <div className={gridStyles.categoryGroups}>
            {categorySections.map(({ category, products: groupedProducts }) => (
              <section key={category.id} className={gridStyles.categorySection}>
                <div className={gridStyles.categorySectionHeader}>
                  <h3 className={gridStyles.categoryTitle}>{category.name}</h3>
                  <span className={gridStyles.categoryCount}>
                    {groupedProducts.length}{" "}
                    {groupedProducts.length === 1 ? "producto" : "productos"}
                  </span>
                </div>

                <div className={gridStyles.cardGrid}>
                  {groupedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={category.name}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className={gridStyles.paginationWrap}>
            <Suspense fallback={null}>
              <ProductPagination
                className={gridStyles.mobilePagination}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                limit={limit}
              />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="admin-empty-state">
          <h2>No hay productos en esta página</h2>
          <p>Volvé a la primera página del catálogo.</p>
          <div className={gridStyles.paginationWrap}>
            <Suspense fallback={null}>
              <ProductPagination
                className={gridStyles.mobilePagination}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                limit={limit}
              />
            </Suspense>
          </div>
        </div>
      )}
    </Card>
  );
}
