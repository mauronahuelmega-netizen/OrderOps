/**
 * Pure contracts for the admin Products list. No server APIs, so both the runtime and
 * `admin-products-search-empty-state-resilience.verify.ts` can import this module.
 *
 * Two product counts exist and must never be substituted for one another:
 *
 * - `catalogTotalCount`  — products owned by the tenant, **unfiltered**. The only valid
 *   signal of catalog existence, and the only input allowed to open onboarding.
 * - `filteredTotalCount` — products matching `q` / `categoryId` / `stock` / `status`.
 *   Describes the size of the current result set and nothing else.
 *
 * CATALOG EMPTY  = catalogTotalCount === 0
 * FILTERED EMPTY = catalogTotalCount > 0 && filteredTotalCount === 0
 */

export type ProductsFlyoutMode = "edit" | "create-product" | "create-category" | null;

/**
 * PostgREST reads `,` `.` `(` `)` and `:` as filter *structure* inside an `or()` group, so
 * an unquoted user value turns ordinary punctuation into syntax and the request fails.
 * Wrapping the value in double quotes makes it a literal; inside the quotes only `"` and
 * `\` need backslash-escaping.
 *
 * The search term is never stripped or rewritten — punctuation keeps its meaning as part
 * of the ILIKE pattern.
 */
export function toPostgrestQuotedLikePattern(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

/** `name ILIKE %q%` OR `sku ILIKE %q%`, safe for arbitrary user punctuation. */
export function buildAdminProductsSearchFilter(q: string): string {
  const pattern = toPostgrestQuotedLikePattern(q);
  return `name.ilike.${pattern},sku.ilike.${pattern}`;
}

/**
 * Decides whether the Products flyout should open by itself.
 *
 * Only a genuinely empty catalog (or a tenant with no categories) may auto-open. A filter
 * that happens to match nothing is a recoverable result state, not an empty catalog, so
 * `filteredTotalCount` is deliberately not a parameter here.
 */
export function resolveEmptyCatalogFlyoutMode(input: {
  categoriesCount: number;
  catalogTotalCount: number;
}): ProductsFlyoutMode {
  if (input.categoriesCount === 0) {
    return "create-category";
  }

  if (input.catalogTotalCount === 0) {
    return "create-product";
  }

  return null;
}
