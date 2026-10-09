# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-IMPLEMENTATION-1

# Result

**PASS — CATEGORY FILTER + ORDER RUNTIME IMPLEMENTED / ATOMIC SAVE WIRED / FINAL QA REQUIRED**

# Scope

Application runtime only on frozen Category Order DB contract.

No DB DDL · no migration edit · no RLS/RPC SQL edit · no business-data Save QA · no commit/push/deploy.

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | pre-existing Products package preserved |

# Frozen DB Contract

| Item | Value |
|------|-------|
| migration | `20260917210150_categories_public_catalog_order.sql` |
| SHA | `47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314` |
| remote | `20260917212712` / `categories_public_catalog_order` |
| append fingerprint | `7b240c4c66b10d8b97ac46dea4ceef57a3ab013c4975e47236af9b1395ab5514` |
| RPC fingerprint | `e82ba8ce34d263743aa7e2ad4ad09336a70ae5e592d0ed24bb12e68346cff8a3` |
| DB changes this phase | **0** |

# Source Ownership

| Concern | Owner |
|---------|--------|
| toolbar | `components/admin/products/products-toolbar.tsx` |
| dialog | `components/admin/products/category-filter-order-dialog.tsx` (+ `.module.css`) |
| draft helpers | `lib/categories/category-order-draft.ts` |
| action | `app/admin/(protected)/categories/actions.ts` → `saveCategoryDisplayOrderAction` |
| category loader | `lib/categories/admin.ts` (unchanged order) |
| public loader | `lib/catalog/public.ts` (unchanged) |
| cache | `revalidatePublicCatalogCache` + `revalidatePath` admin products/categories |
| types | `types/database.ts` + `save_category_display_order` Function entry |

# Category Filter Before

Native `<select aria-label="Filtrar por categoría">` in Products toolbar.

# Implemented Architecture

- Category control → custom trigger opens one native `<dialog>`
- Modes: FILTER | ORDER (same dialog)
- Local draft (`persistedOrder` / `draftOrder`) until explicit Save
- Pointer Events grip reorder (touch-capable) + keyboard Subir/Bajar
- Save → one server action → one RPC
- Stock/Estado remain native selects

# Category Trigger

- Closed: “Categorías” or selected name (ellipsis + full `aria-label` / `title`)
- Compact filter-row chrome (not primary CTA)
- No GripVertical on closed trigger

# Filter Mode

- “Todas” + all tenant categories in configured order
- Selection sets/clears `categoryId`, deletes `page`, preserves `q`/`stock`/`status`
- Closes dialog after choice
- “Ordenar categorías” only when `categories.length >= 2`

# URL Contract

Frozen: `pushParams` still deletes `page`; Category uses existing `handleFilterChange("categoryId", …)`; Limpiar filtros still `router.push(pathname)`.

# Order Mode

- All tenant categories
- GripVertical pointer-only drag (`touch-action: none` on grip)
- Subir / Bajar with first/last disabled
- Row click does not filter
- Helper: `Arrastrá las categorías para definir el orden del catálogo.`
- Footer: Cancelar + Guardar orden

# Local Draft

Semantic ID-sequence dirty. Mode entry pristine. Drag/keyboard local-only (0 RPC). Revert → pristine.

# Pointer / Touch Reorder

Feature-local Pointer Events on grip (`setPointerCapture` + `elementFromPoint` row crossing). Not HTML5 DnD. Does not alter customization `sortable-reorder-list` persistence.

# Keyboard Reorder

Subir/Bajar buttons with accessible labels. Local draft only.

# Cancel / Escape

- Cancelar: discard → FILTER · 0 writes
- Escape in ORDER: `cancel` preventDefault → discard → FILTER · 0 writes
- Escape in FILTER: native close

# Save Action

`saveCategoryDisplayOrderAction({ orderedCategoryIds })`

- `requireAdminPermission("manageProducts")`
- validates UUID array (no duplicates)
- RPC `save_category_display_order` once
- no client `businessId` / numeric positions
- no raw `categories.update({ position })`

# RPC Wiring

Typed via `types/database.ts` Functions entry. One call per Save.

# Error Mapping

| Domain | UX |
|--------|-----|
| STALE_SET | stale copy + `stale: true` · draft preserved · Save disabled |
| INVALID / UNAUTH / FORBIDDEN | generic safe error |
| other | generic safe error |

# Stale Set UX

Safe message; draft kept; user Cancel → re-enter Order on fresh set. No silent merge.

# Cache Invalidation

Success only:

- `/admin/products`
- `/admin/categories`
- `revalidatePublicCatalogCache({ scope: "catalog" })`

No `revalidatePath("/")`.

# Prop Reconciliation

Filter / pristine Order: sync to server IDs. Dirty Order: never replace draft; membership change → stale flag.

# Create Compatibility

`createCategoryAction` still inserts `{ business_id, name }` only — position trigger-owned.

# Public Catalog Integration

Loader still orders by `position`, then `name`. Visible subset relative order unchanged by this phase.

# Admin Category Integration

`/admin/categories` — no DnD / order UI added.

# Product Order Freeze

No product sort changes.

# Responsive

Dialog `dvh`-aware max height; rows/grip/move ≥44–48px; compact widths supported via CSS.

# Light / Dark

Semantic tokens only (`--bg-surface`, `--text-*`, `--accent-primary`, etc.).

# Accessibility

Native dialog · mode titles · `aria-selected` filter options · status/alert live regions · keyboard Subir/Bajar · Escape mode contract · focus return to trigger / Ordenar.

# Type Reconciliation

Added `save_category_display_order` to `Database["public"]["Functions"]`. Category Insert still allows omitting `position`.

# Focused Verify

`lib/categories/admin-categories-public-catalog-order-implementation.verify.ts` — **PASS**

# Mutation Probes

`VERIFY_PROBES=1` — **PASS** (A–N)

# Related Verifies

DB-author focused verify — **PASS**

# Runtime Smoke

Not fully browser-exercised in this phase (non-mutating smoke deferred where local auth unavailable). Implementation QA business mutations: **0**. Final QA owns real Save/restore.

# TypeScript

`npx tsc --noEmit` — **PASS**

# Build

`npm run build` — **PASS**

# Diff

`git diff --check` — **PASS**  
No migration edits.

# DB Delta

**0**

# Business Delta

**0**

# Remaining QA

REAL REORDER SAVE + RESTORE + PUBLIC/ADMIN E2E CERTIFICATION

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

# Release

COMMIT/PUSH/DEPLOY: **PAUSED**
