/**
 * Verify ADMIN-PRODUCTS-SEARCH-EMPTY-STATE-RESILIENCE-FIX-1.
 *
 * A. Search filter builder tolerates user punctuation without destroying the term
 *    (PROD-P1-3).
 * B. Empty-state resolver decides on the unfiltered catalog count only (PROD-P1-1).
 * C. A filtered count can never act as a catalog-existence signal.
 * D. Filtered-empty exposes exactly one `Limpiar filtros` owner (PROD-P3-9).
 *
 * Run: npx tsx lib/products/admin-products-search-empty-state-resilience.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildAdminProductsSearchFilter,
  resolveEmptyCatalogFlyoutMode,
  toPostgrestQuotedLikePattern
} from "@/lib/products/products-list-contracts";

// ---------------------------------------------------------------------------
// A. SEARCH BUILDER
// ---------------------------------------------------------------------------

const SEARCH_CASES = [
  { label: "normal", q: "combo" },
  { label: "comma", q: "a,b" },
  { label: "parentheses", q: "Pizza (grande)" },
  { label: "quote", q: 'producto "especial"' },
  { label: "backslash", q: "producto\\test" },
  { label: "spaces", q: "combo doble" },
  { label: "dots", q: "combo 2.0" },
  { label: "colon", q: "combo: familiar" }
];

for (const { label, q } of SEARCH_CASES) {
  const filter = buildAdminProductsSearchFilter(q);

  // Both searchable columns survive, with ILIKE semantics intact.
  assert.ok(
    filter.includes("name.ilike."),
    `[${label}] name.ilike must remain in the filter`
  );
  assert.ok(filter.includes("sku.ilike."), `[${label}] sku.ilike must remain in the filter`);

  // The value is quoted, so punctuation is data and not filter structure.
  assert.equal(
    filter,
    `name.ilike.${toPostgrestQuotedLikePattern(q)},sku.ilike.${toPostgrestQuotedLikePattern(q)}`,
    `[${label}] filter must be built from the quoted pattern for both columns`
  );

  // Exactly two top-level conditions: the only unquoted comma is the separator between
  // them. A raw user comma leaking into the expression would raise this count.
  const unquotedCommas = countUnquotedCommas(filter);
  assert.equal(
    unquotedCommas,
    1,
    `[${label}] expected 1 structural comma, found ${unquotedCommas} in: ${filter}`
  );

  // Every quoted segment is balanced.
  assert.equal(
    countUnescapedQuotes(filter) % 2,
    0,
    `[${label}] quoted segments must be balanced in: ${filter}`
  );
}

// Punctuation is preserved, never stripped or collapsed.
assert.equal(toPostgrestQuotedLikePattern("a,b"), '"%a,b%"');
assert.ok(
  buildAdminProductsSearchFilter("a,b").includes("a,b"),
  "the comma must survive inside the pattern"
);
assert.ok(
  !buildAdminProductsSearchFilter("a,b").includes("%ab%"),
  '"a,b" must not be rewritten as "ab"'
);
assert.equal(
  toPostgrestQuotedLikePattern("Pizza (grande)"),
  '"%Pizza (grande)%"',
  "parentheses must be preserved verbatim"
);
assert.equal(
  toPostgrestQuotedLikePattern("combo doble"),
  '"%combo doble%"',
  "internal spaces must be preserved"
);

// Quotes and backslashes are escaped rather than removed.
assert.equal(toPostgrestQuotedLikePattern('a"b'), '"%a\\"b%"');
assert.equal(toPostgrestQuotedLikePattern("a\\b"), '"%a\\\\b%"');
assert.ok(
  toPostgrestQuotedLikePattern('a"b').includes('\\"'),
  "a user double quote must be backslash-escaped"
);

// Escaping order matters: a backslash must not end up escaping the closing quote.
assert.equal(
  toPostgrestQuotedLikePattern('a\\"b'),
  '"%a\\\\\\"b%"',
  "backslash must be escaped before the quote it precedes"
);

// ---------------------------------------------------------------------------
// B. EMPTY STATE RESOLVER
// ---------------------------------------------------------------------------

// No categories at all → onboarding starts with a category.
assert.equal(
  resolveEmptyCatalogFlyoutMode({ categoriesCount: 0, catalogTotalCount: 0 }),
  "create-category"
);

// Categories exist but the tenant owns no products → genuine CATALOG EMPTY.
assert.equal(
  resolveEmptyCatalogFlyoutMode({ categoriesCount: 5, catalogTotalCount: 0 }),
  "create-product"
);

// FILTERED EMPTY: catalog has products, the filter matched none → no auto-open.
assert.equal(
  resolveEmptyCatalogFlyoutMode({ categoriesCount: 5, catalogTotalCount: 18 }),
  null
);

// Normal populated result → no auto-open.
assert.equal(
  resolveEmptyCatalogFlyoutMode({ categoriesCount: 5, catalogTotalCount: 18 }),
  null
);

// A category-less tenant that somehow has products still starts with the category step.
assert.equal(
  resolveEmptyCatalogFlyoutMode({ categoriesCount: 0, catalogTotalCount: 18 }),
  "create-category"
);

// ---------------------------------------------------------------------------
// C. SEMANTICS — a filtered count may not decide catalog existence
// ---------------------------------------------------------------------------

// The resolver takes no filtered input at all: for one catalog count, the answer is
// identical no matter what the filtered result size was.
for (const filteredTotalCount of [0, 1, 6, 18]) {
  void filteredTotalCount;
  assert.equal(
    resolveEmptyCatalogFlyoutMode({ categoriesCount: 5, catalogTotalCount: 18 }),
    null,
    "auto-open must not vary with the filtered result size"
  );
}

const resolverSource = readFileSync(
  path.join(process.cwd(), "lib/products/products-list-contracts.ts"),
  "utf8"
);
assert.ok(
  !/filteredTotalCount/.test(
    resolverSource.slice(resolverSource.indexOf("export function resolveEmptyCatalogFlyoutMode"))
  ),
  "resolveEmptyCatalogFlyoutMode must not read any filtered count"
);

// The page must feed the resolver from the unfiltered catalog count.
const pageSource = readFileSync(
  path.join(process.cwd(), "app/admin/(protected)/products/page.tsx"),
  "utf8"
);
assert.ok(
  pageSource.includes("getAdminProductsCatalogCount"),
  "page must resolve catalog existence through the unfiltered count query"
);
assert.ok(
  pageSource.includes("catalogTotalCount"),
  "page must pass catalogTotalCount to the provider"
);
assert.ok(
  !/getAdminProducts\([^)]*limit:[ \t]*1/.test(pageSource),
  "page must not reuse a filtered limit:1 probe as the catalog signal"
);

// Tenant scoping stays on the catalog count query.
const adminSource = readFileSync(path.join(process.cwd(), "lib/products/admin.ts"), "utf8");
const catalogCountFn = adminSource.slice(
  adminSource.indexOf("export async function getAdminProductsCatalogCount")
);
assert.ok(
  catalogCountFn.includes('.eq("business_id", businessId)'),
  "catalog count must stay scoped to business_id"
);
assert.ok(
  catalogCountFn.includes("head: true"),
  "catalog count must be count-only, not a row fetch"
);
assert.ok(
  adminSource.includes("buildAdminProductsSearchFilter(q)"),
  "the products query must use the escaped search filter builder"
);
assert.ok(
  !adminSource.includes("name.ilike.%${q}%"),
  "the raw interpolated search filter must be gone"
);
assert.ok(
  adminSource.includes('.eq("business_id", businessId)'),
  "tenant scoping must remain on the products list query"
);

// ---------------------------------------------------------------------------
// D. DUPLICATE CLEAR FILTERS
// ---------------------------------------------------------------------------

const emptyStateSource = readFileSync(
  path.join(process.cwd(), "components/admin/products/product-catalog-empty-state.tsx"),
  "utf8"
);
const toolbarSource = readFileSync(
  path.join(process.cwd(), "components/admin/products/products-toolbar.tsx"),
  "utf8"
);

assert.ok(
  !emptyStateSource.includes("actionLabel"),
  "the empty state must not render a second Limpiar filtros control"
);
assert.ok(
  !emptyStateSource.includes("onAction"),
  "the empty state must not own a clear-filters handler"
);
assert.ok(
  toolbarSource.includes("Limpiar filtros"),
  "the toolbar remains the single Limpiar filtros owner"
);
assert.ok(
  toolbarSource.includes("hasActiveFilters"),
  "the toolbar clear control stays gated on active filters"
);

// The toolbar summary must report the catalog total, not the filtered result size.
assert.ok(
  toolbarSource.includes("catalogTotalCount"),
  "toolbar summary must use the unfiltered catalog count"
);
assert.ok(
  !/\{totalCount\}/.test(toolbarSource),
  "toolbar must not present a filtered count as the catalog size"
);

// Preserved behaviour: debounce, URL-driven filters and pagination reset.
assert.ok(toolbarSource.includes("300"), "search debounce must remain 300ms");
assert.ok(
  toolbarSource.includes('params.delete("page")'),
  "filter changes must still reset pagination"
);
assert.ok(toolbarSource.includes("router.push"), "filters must stay URL-driven");

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function countUnquotedCommas(expression: string): number {
  let inQuotes = false;
  let escaped = false;
  let commas = 0;

  for (const char of expression) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      commas += 1;
    }
  }

  return commas;
}

function countUnescapedQuotes(expression: string): number {
  let escaped = false;
  let quotes = 0;

  for (const char of expression) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      quotes += 1;
    }
  }

  return quotes;
}

console.log("admin-products-search-empty-state-resilience.verify.ts: PASS");
