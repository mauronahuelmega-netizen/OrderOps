export type CatalogSearchProduct = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
};

export type CatalogSearchCategory = { id: string; name: string };

export type CatalogSearchEntry<TProduct extends CatalogSearchProduct = CatalogSearchProduct> = {
  product: TProduct;
  categoryId: string;
  normalizedCorpus: string;
};

export const CATALOG_SEARCH_THRESHOLDS = {
  mediumProductCount: 25,
  mediumCategoryCount: 5,
  largeProductCount: 60,
  largeCategoryCount: 8,
  largeCategoryProductCount: 24,
  veryLargeProductCount: 160,
  veryLargeCategoryCount: 16
} as const;

export type CatalogSize = "small" | "medium" | "large" | "very_large";

export function normalizeCatalogSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function getCatalogSize(input: {
  productCount: number;
  categoryCount: number;
  maxVisibleProductsInCategory: number;
}): CatalogSize {
  const { productCount, categoryCount, maxVisibleProductsInCategory } = input;
  if (productCount >= CATALOG_SEARCH_THRESHOLDS.veryLargeProductCount || categoryCount >= CATALOG_SEARCH_THRESHOLDS.veryLargeCategoryCount) return "very_large";
  if (productCount >= CATALOG_SEARCH_THRESHOLDS.largeProductCount || categoryCount >= CATALOG_SEARCH_THRESHOLDS.largeCategoryCount || maxVisibleProductsInCategory >= CATALOG_SEARCH_THRESHOLDS.largeCategoryProductCount) return "large";
  if (productCount >= CATALOG_SEARCH_THRESHOLDS.mediumProductCount || categoryCount >= CATALOG_SEARCH_THRESHOLDS.mediumCategoryCount) return "medium";
  return "small";
}

export function createCatalogSearchIndex<TProduct extends CatalogSearchProduct>(products: TProduct[], categories: CatalogSearchCategory[]): CatalogSearchEntry<TProduct>[] {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return products.map((product) => ({
    product,
    categoryId: product.category_id,
    normalizedCorpus: normalizeCatalogSearchText([product.name, product.description, categoryNames.get(product.category_id) ?? ""].join(" "))
  }));
}

export function getCatalogSearchTokens(query: string | null | undefined) {
  const normalizedQuery = normalizeCatalogSearchText(query);
  return normalizedQuery ? normalizedQuery.split(" ") : [];
}

export function filterCatalogSearchEntries<TProduct extends CatalogSearchProduct>(entries: CatalogSearchEntry<TProduct>[], tokens: string[], categoryId: string | null) {
  return entries.filter((entry) => tokens.every((token) => entry.normalizedCorpus.includes(token)) && (!categoryId || entry.categoryId === categoryId));
}
