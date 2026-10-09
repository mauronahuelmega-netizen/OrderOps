# ADMIN-PRODUCTS-COLLECTION-RESPONSIVE-ARCHITECTURE-1

# Result

**PASS.**

# Closed

- **PROD-P2-2** — CLOSED. Dual mount removed; one active collection tree.
- **PROD-P2-7 pagination** — CLOSED. Shared `ProductPagination` under the collection owner
  (available to mobile and desktop). Mobile stock/SKU/inline availability still deferred.
- **PROD-P3-1** — CLOSED. Grid is 1 col `<720`, 2 cols `720–899` (no 768–899 single-col override).
- **PROD-P3-2** — COLLECTION ONLY CLOSED. Collection switch is solely `900px`. Flyout 961 /
  toolbar 768/1024 unchanged.

# Architecture

- **mobile (`<900`):** `ProductGridServer` + `ProductCard`
- **desktop (`>=900`):** `ProductTableView`
- **breakpoint:** `(min-width: 900px)` via feature-local `useProductsDesktopCollection`
- **SSR snapshot:** `false` (mobile-first, deterministic)
- **hydration:** `useSyncExternalStore` — server snapshot matches first client snapshot; no
  `window.innerWidth`, no `suppressHydrationWarning`
- **single tree:** ternary mount; CSS `desktopOnly`/`mobileOnly` removed

# Pagination

- **owner:** `product-catalog-views.tsx` (exactly one `ProductPagination`)
- **URL semantics:** unchanged (`page` search param, `ADMIN_PRODUCTS_PAGE_SIZE=24`)
- Removed duplicate pagination from table and grid renderers

# Runtime

- **390:** cards 18, tables 0, 1 column, pagination 0 (≤1 page)
- **899:** cards 18, tables 0, **2 columns**
- **900:** cards 0, tables 1, rows 18
- **resize 900→899→900:** no dual tree, URL/search unchanged, flyout closed

# Verification

- targeted: PASS
- tsc: PASS
- diff: PASS
- resize fetch: NONE BY SOURCE (hook/views introduce no `getAdminProducts` / `fetch`)

# Boundaries

Runtime: hook + catalog-views (+css) + grid-server + table-view + grid.css (6).  
No provider rewrite, no actions, no DB/migrations, no global CSS. Data mutations: 0.

# Remaining

P2-7 operational mobile (stock/SKU/inline availability), touch targets, header density,
contrast, flyout a11y, images, summary duplication — later polish phases.
