# ADMIN-PRODUCTS-SEARCH-EMPTY-STATE-RESILIENCE-FIX-1

# Result

PASS.

# Closed

- **PROD-P1-3** — CLOSED. Punctuation in `q` no longer breaks `/admin/products`.
- **PROD-P1-1** — CLOSED. `FILTERED EMPTY` is no longer read as `CATALOG EMPTY`.
- **PROD-P3-9** — CLOSED. One `Limpiar filtros` owner.
- **PROD-P3-4** — PARTIAL.
  - CLOSED: the toolbar summary no longer presents a filtered count as the catalog size.
    Both of its numbers (`catalogTotalCount` + `categories.length`) are now unfiltered and
    therefore coherent with each other.
  - DEFERRED: the duplication between the toolbar summary and the `ProductGridServer`
    catalog header, plus that header's page-scoped `N activos / N inactivos /
    N categorías` metrics (computed from the current page only, not the catalog). Closing
    it needs new aggregate queries and a header restructure — out of scope for a
    functional microphase per the brief.

# Contract

**`catalogTotalCount`** — products owned by the tenant, unfiltered. The only catalog
existence signal, and the only input allowed to auto-open onboarding. Sourced from
`getAdminProductsCatalogCount(businessId)`, a count-only (`head: true`) query scoped by
`business_id`. Replaces the previous filter-scoped `getAdminProducts({ limit: 1 })` probe,
so the page no longer fetches a row just to learn whether a catalog exists.

**`filteredTotalCount`** — rows matching `q` / `categoryId` / `stock` / `status`. Remains
`AdminProductsPageResult.totalCount`, produced by the existing paged query inside
`ProductCatalogSection` and consumed only by the collection header and pagination. It is
never a catalog-existence signal.

```
CATALOG EMPTY  = catalogTotalCount === 0
FILTERED EMPTY = catalogTotalCount > 0 && filteredTotalCount === 0
```

`resolveEmptyCatalogFlyoutMode({ categoriesCount, catalogTotalCount })` takes no filtered
input at all, so a zero-result filter structurally cannot open Create Product:

| categories | catalog | result |
|---|---|---|
| 0 | any | `create-category` |
| > 0 | 0 | `create-product` |
| > 0 | > 0 | `null` (regardless of filtered count) |

**Search escaping** — PostgREST parses `,` `.` `(` `)` `:` as filter structure inside an
`or()` group, so the previous `` `name.ilike.%${q}%,sku.ilike.%${q}%` `` turned user
punctuation into syntax and failed the request. The value is now double-quoted, which makes
it a literal, with `"` and `\` backslash-escaped inside the quotes:

```
q = a,b  →  name.ilike."%a,b%",sku.ilike."%a,b%"
```

Nothing is stripped or rewritten. `name` OR `sku`, ILIKE semantics, the 300ms debounce,
URL-driven filtering, pagination reset and `.eq("business_id", businessId)` are all
unchanged. Punctuation is treated as a value, never as filter structure, so the input
cannot become an arbitrary PostgREST expression.

**Clear filters** — `ProductsToolbar` is the single owner and already gates its control on
`hasActiveFilters`, which is necessarily true in `FILTERED EMPTY`.
`ProductCatalogEmptyState` therefore drops its duplicate button and points at that control
instead. This deviates from the brief's stated preference (contextual CTA inside the empty
state) because suppressing the toolbar control instead would require pushing the filtered
result state from a suspended server sibling into client state — the same cross-subtree
sync pattern that produced PROD-P1-1. No CSS was needed and no third owner was created. As
a side effect the meaningless `Limpiar filtros` that used to render in a genuinely empty
catalog (no filters to clear) is gone.

# Verify

- targeted: `lib/products/admin-products-search-empty-state-resilience.verify.ts` — PASS
  (search builder across normal/comma/parentheses/quote/backslash/spaces/dot/colon,
  structural-comma count, quote balance, resolver matrix, filtered-count-never-decides-
  existence, tenant scoping, single clear owner, debounce/pagination-reset preservation).
- tsc: `npx tsc --noEmit` — PASS.
- diff: `git diff --check` — PASS (CRLF notices only).

Not run, reserved for FINAL QA: `npm run build`, `npm run lint`, full verify suite.

# Runtime smoke

One authenticated session, one viewport (384px), no mutations.

- normal — `?q=combo`: 6 results, no dialog, summary `18 productos · 5 categorías`
  (catalog total, not the filtered 6).
- comma — `?q=a,b`: **HTTP 200, no crash**, empty state, `dialogs: 0`, search input still
  holds the literal `a,b`. Previously a full page error.
- punctuation sweep — `Pizza (grande)`, `producto "especial"`, `producto\test`,
  `combo: familiar`, `combo 2.0`: all HTTP 200, no server error.
- meaning preserved — `Coca Cola`, `Cola 500ml`, `coca cola 500`, `Combo BBQ` all match;
  `Coca, Cola` and `Coca (Cola)` correctly do **not** match. A punctuation-stripping fix
  would have wrongly matched these, so the input keeps its literal search meaning.
- zero-result — `?q=zzzznoresults`: 0 rows / 0 cards, empty state visible, `dialogs: 0`,
  `aria-modal: 0`, no create form in the DOM, exactly **1** visible `Limpiar filtros`
  (in the toolbar).
- clear — click `Limpiar filtros`: URL back to `/admin/products`, 18 rows restored, empty
  state gone, flyout still closed, search input cleared, clear control correctly hidden.

`CATALOG EMPTY` was validated by the pure resolver and the source contract only. No tenant
was emptied and no product was deleted.

# Boundaries

- runtime files: 6.
  - `lib/products/products-list-contracts.ts` (new, pure — both contracts, importable by
    the verify because it carries no `server-only`)
  - `lib/products/admin.ts`
  - `app/admin/(protected)/products/page.tsx`
  - `components/admin/products/products-management-provider.tsx`
  - `components/admin/products/products-toolbar.tsx`
  - `components/admin/products/product-catalog-empty-state.tsx`
- CSS: none.
- DB / RPC / migrations / triggers / RLS: unchanged.
- product mutations: 0. No create, edit, delete or availability change.
- untouched: `products/actions.ts`, product forms, availability toggle, stock logic, SKU,
  images, image loader, `next.config`, public catalog, customizations, preview, admin
  shell, shared UI, `globals.css`, `theme-tokens.css`, responsive, flyout a11y.
- commit / push / deploy: none.

Preserved in the provider: manual `+ Nuevo producto`, edit state, `selectedProduct`, close
behaviour, create-category behaviour, create-success and edit-success behaviour. The
provider was not rewritten — the resolver moved to a pure module and the ambiguous
`totalCount` was renamed to `catalogTotalCount`.

# Gate

All gate conditions met: `a,b` does not break the page; punctuation is escaped rather than
destroyed; name + SKU search intact; filtered empty does not auto-open create; catalog
empty still auto-opens create-product; category empty still opens create-category; a single
`Limpiar filtros` in zero-result; targeted verify, runtime smoke, tsc and diff-check all
PASS; no product mutation; DB/RPC/migrations intact; nothing out of scope changed.

# Next

`ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-1` (PROD-P1-2). PROD-P1-4 also remains open.
