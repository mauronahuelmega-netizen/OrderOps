import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProductListItem } from "@/lib/products/admin";

export type ProductCategorySection = {
  category: AdminCategory;
  products: AdminProductListItem[];
};

export type CatalogMetrics = {
  activeProductsOnPage: number;
  inactiveProductsOnPage: number;
  productsOnPage: number;
};

export function buildCategorySections(
  categories: AdminCategory[],
  products: AdminProductListItem[]
): ProductCategorySection[] {
  return categories
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
    .filter((section) => section.products.length > 0);
}

export function countCategoriesWithProducts(
  categories: AdminCategory[],
  products: AdminProductListItem[]
): number {
  return categories.filter((category) =>
    products.some((product) => product.category_id === category.id)
  ).length;
}

export function computeCatalogMetrics(products: AdminProductListItem[]): CatalogMetrics {
  const activeProductsOnPage = products.filter((product) => product.is_available).length;

  return {
    activeProductsOnPage,
    inactiveProductsOnPage: products.length - activeProductsOnPage,
    productsOnPage: products.length
  };
}
