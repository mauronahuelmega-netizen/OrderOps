# ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1

# Result

**PASS — PRODUCT LIFECYCLE CERTIFIED END-TO-END / ARCHIVE + RESTORE + PERMANENT DELETE CLOSED**

# Certification Scope

Live local application (`localhost:3000`) against OrderOps project `pkrsedmwxekbhlohhqds`.

Disposable fixtures only (`__QA_LIFECYCLE_FINAL__*`) on La Burguesía admin session.

Source / DB / RPC / RLS: **FROZEN** (no runtime fixes in this phase).

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | PRE-EXISTING Products package preserved (no reset/stash/clean) |

# DB Baseline

| Field | Value |
|-------|-------|
| migration file | `supabase/migrations/20260916180000_products_removal_lifecycle.sql` |
| SHA256 | `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57` |
| remote history | `20260916195024_products_removal_lifecycle` (count **1**) |
| RPC | `public.delete_product_permanently(uuid)` |
| fingerprint | `81f2046de539d43db38aa583574d5486` |
| raw DELETE policies | **0** |
| `archived_at` | LIVE |
| archive⇒unavailable CHECK | LIVE |
| DB drift | **NONE** |

# DB Immutability

| Check | Pre | Post |
|-------|-----|------|
| migration SHA | match | match |
| RPC fingerprint | `81f2046…` | `81f2046…` |
| lifecycle history count | 1 | 1 |
| raw DELETE policies | 0 | 0 |
| schema/RLS/RPC changes | 0 | 0 |

# Fixture Plan

Business: La Burguesía (`e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`) — safe disposable prefix only; merchant catalog untouched.

Preparation: **QA-prepared** (SQL insert + Storage upload) — UI Create not required for relation/image matrix.

# Fixture IDs

| Code | UUID | Fate |
|------|------|------|
| ACTIVE_BASIC | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1` | Archive UI → Restore UI → cleanup delete |
| ACTIVE_DELETE | `…aaa2` | Real UI permanent delete (+ relations) |
| ARCHIVE_RESTORE | `…aaa3` | Assignment preserve archive/restore → cleanup |
| ARCHIVED_DELETE | `…aaa4` | Archive then real UI delete (no restore) |
| IMAGE_SINGLE_OWNER | `…aaa5` | RPC delete + app-layer Storage cleanup |
| IMAGE_SHARED_ACTIVE_A/B | `…aaa6` / `…aaa7` | Shared-X matrix |
| IMAGE_SHARED_ARCHIVED | `…aaa8` | Shared-Y archived reference |
| DIRTY_FLOW | `…aaa9` | Dirty Archive/Delete intercept UI |
| PUBLIC_MANUAL_SELECTOR | `…aa10` | Public visibility + shared-Y active owner |

Prefix: `__QA_LIFECYCLE_FINAL__`

# Default Collection

- Non-archived QA fixtures visible under search `__QA_LIFECYCLE_FINAL__`
- Archivados filter shows only archived QA rows
- Active/inactive filters compose without archived leakage
- Search/category/stock filters operable

# Archive

| Gate | Result |
|------|--------|
| cancel | **PASS** — DB unchanged; focus returned to Archivar |
| confirm | **PASS** — one mutation; flyout closed; toast “Producto archivado.” |
| preserved fields | same id/SKU/stock/category/track_stock; `archived_at` set; `is_available=false` |
| public | excluded (archived not in available+non-archived set) |
| default collection | disappears from default/search |
| archived collection | appears under `status=archived` |
| Storage | **0** mutations on archive |

# Archived Collection

**PASS** — Archivados + search shows archived fixtures; opens read-only detail.

# Archived Read-Only Detail

| Gate | Result |
|------|--------|
| banner | “Producto archivado” + out-of-catalog copy |
| fields | disabled / readOnly |
| image | view-only (“Sin imagen” when null) |
| Save | **absent** |
| availability toggle | locked |
| Advanced | inspectable (collapsed/disabled when empty) |
| lifecycle | Restaurar / Eliminar |

# Archived Server Guards

| Path | Evidence | Result |
|------|----------|--------|
| saveProductEditDraftAction | source deny + UI no Save + implementation verify | **PASS** |
| setProductAvailabilityAction | source deny + DB CHECK rejects `is_available=true` while archived | **PASS** |
| legacy updateProductAction | source archived deny | **PASS** |
| customization new target | `lib/product-customization/admin.ts` `.is("archived_at", null)` | **PASS** |

Direct Next.js server-action cookie invoke not instrumented; layered source + UI + CHECK + focused verify agree.

# Restore

| Gate | Result |
|------|--------|
| same ID | **PASS** |
| availability | remains `false` (Restore ≠ Publish) |
| preserved state | SKU/stock unchanged |
| public | still hidden while unavailable |
| feedback | “Producto restaurado. Sigue no disponible…” |

# Dirty + Archive

| Step | Result |
|------|--------|
| dirty → Archivar | discard dialog; **0** archive mutation |
| Seguir editando | draft preserved |
| Descartar cambios | draft reset; Archive confirm opens; still **0** mutation until confirm |
| Cancel Archive | product unchanged |

# Dirty + Delete

| Step | Result |
|------|--------|
| dirty → Eliminar | discard dialog; delete RPC **0** |
| Seguir editando | draft preserved |

# Permanent Delete — Active

Real UI on ACTIVE_DELETE:

| Gate | Result |
|------|--------|
| cancel first | no mutation |
| confirm | one canonical action → `delete_product_permanently` |
| raw table delete | **ABSENT** in app/lib |
| row | gone |
| relations | stock_movements/overrides/assignments/upsell_items **0**; shared group + category remain |
| feedback | success path (“Producto eliminado.”) |
| undo | none |

# Permanent Delete — Archived

Real UI on ARCHIVED_DELETE (pre-archived):

| Gate | Result |
|------|--------|
| result | deleted; no Restore prerequisite |
| list | archived search empty after |

# Delete Confirmation

Copy exact: “El producto se eliminará permanentemente. Esta acción no se puede deshacer.”

Buttons: Cancelar / Eliminar — no typed name, no second modal, no enumerations.

# Historical Orders

**FINAL-QA HISTORY REGRESSION: SOURCE/LIVE BASELINE PRESERVED**

Fresh disposable order attach not executed (unsafe/disproportionate in shared demo tenant). DB-APPLY certification of `product_id` NULL + snapshot preservation stands.

# Relational Cleanup

ACTIVE_DELETE pre: stock_movements=1, overrides=1, assignments=1, upsell_items=1.

Post UI delete: all **0**; shared customization group + category remain.

# Public Catalog

SQL mirror of public contract (`is_available=true` AND `archived_at IS NULL`):

- archived ACTIVE_BASIC: hidden
- restored unavailable: hidden
- active available QA: visible
- deleted: absent

Preview route shares public filters (source).

# Preview

Source contract aligned with public archived exclusion — **PASS** (source).

# Manual Order

Archived/unavailable exclusion in loaders/validation — **PASS** (source: order-validation + admin queries).

# Customization Targeting

| Gate | Result |
|------|--------|
| new target archived | excluded (`.is("archived_at", null)`) |
| existing assignment after archive | preserved (count=1 through archive→restore on ARCHIVE_RESTORE) |
| delete reconciliation | assignments removed with product (ACTIVE_DELETE) |

# Image Cleanup

## Single Owner

RPC delete returned `image_url` → `removeProductImageIfUnreferenced` → **deleted** → Storage **ABSENT**.

## Shared Active Reference

Delete A → B remains → cleanup **skipped_referenced** → X **EXISTS**.

Delete B → cleanup **deleted** → X **ABSENT**.

## Shared Archived Reference

Delete active Y partner → archived owner remains → cleanup **skipped_referenced** → Y **EXISTS**.

Delete archived owner → cleanup **deleted** → Y **ABSENT**.

## Cleanup Failure Semantics

**RUNTIME INJECTION: NOT PERFORMED** (no policy sabotage).

**SOURCE CONTRACT: PASS** — DB delete commits first; Storage failure yields warning while product stays deleted (`deleteProductPermanentlyAction`).

# Only-Archived Catalog

**SOURCE PROOF** — empty-state exposes “Ver archivados”; catalog existence includes archived; Create auto-open gated on true zero (`product-catalog-empty-state.tsx`). Isolated tenant empty-all not used (merchant safety).

# True Zero Catalog

**SOURCE PROOF** — existence count distinguishes archived-only vs zero rows. No merchant catalog emptied.

# Filters

`?status=active|inactive|archived` + `q` + `categoryId` + `stock` + `page` — compose; no crash; archived leakage none in default.

# Responsive QA

| Width | Lifecycle one-row | ≥44px | overflow |
|-------|-------------------|-------|----------|
| 360 | PASS (Archivar/Eliminar same Y) | PASS (h=44) | none |
| 390 / short 700 | PASS | PASS | none |
| 412 | PASS (CSS contract + visual polish verify) | PASS | — |
| 899 / 900 / ≥961 | PASS (collection + polish verify + desktop layout) | — | — |

# Short Viewport

390×700: lifecycle reachable; sticky footer present; single scroll owner — **PASS**.

# Theme QA

Light ↔ dark toggle operable; lifecycle actions/dialogs remain readable — **PASS**.

# Accessibility

| Gate | Result |
|------|--------|
| keyboard Archive cancel → focus Archivar | **PASS** |
| Delete dialog copy/focus entry | **PASS** |
| archived Restaurar/Eliminar present | **PASS** |
| Escape ownership | source + prior polish; Archive cancel restores trigger |
| touch ≥44 | **PASS** at 360/390 |

# Focus / Escape

Archive Cancel → focus Archivar **PASS**. Delete Cancel observed. Lifecycle confirm Escape ownership covered by dialog `showModal` pattern (implementation verify).

# Network QA

| Event | Writes |
|-------|--------|
| Archive dialog open / cancel | 0 |
| Archive confirm | 1 lifecycle update |
| Delete cancel | 0 |
| Delete confirm | 1 RPC via server action |
| Storage | after RPC success only |
| duplicates | pending disables (“Archivando…” / “Eliminando…”) |
| idempotent RPC second call | `deleted=false` safe |

# Create Regression

Lifecycle controls absent on Create — verify **PASS**; no visual leakage.

# Edit Regression

Unified draft / dirty / sticky Save / image intents — related verifies **PASS**.

# Advanced Regression

Hierarchy/motion verifies unchanged; empty Advanced stable on fixtures.

# Builder Regression

Immediate mode unchanged; target eligibility excludes archived (source).

# Verification

| Suite | Result |
|-------|--------|
| lifecycle implementation | PASS (+ probes restore) |
| visual/copy polish | PASS |
| DB-author | PASS (SHA) |
| unified draft | PASS |
| dirty state | PASS |
| image lifecycle | PASS |
| stock/availability | PASS |
| collection responsive | PASS |

# tsc

**PASS** (`npx tsc --noEmit` exit 0)

# Build

**PASS** (`npm run build` exit 0)

# Diff

`git diff --check` **PASS** (CRLF warnings only).

No Final-QA runtime source edits.

# Fixture Reconciliation

| Object | Residue |
|--------|---------|
| QA products | **0** |
| QA stock_movements / overrides / assignments / upsell items | **0** |
| QA Storage objects | **0** |
| targeted net delta | **0** |

# Storage Reconciliation

Paths `qa-single.webp`, `qa-shared-x.webp`, `qa-shared-y.webp` — all **ABSENT** after cleanup. No broad bucket wipe.

# Existing Merchant Safety

Merchant product IDs unchanged (BBQ Bacon, Clásica, Coca Cola, Crispy Chicken, Doble Smash, Sprite, Veggie) — archived_at null preserved; images untouched.

Profiles/categories: **0** modifications.

# Remaining Accepted Debt

- image transforms infrastructure
- historical orphan cleanup
- real-phone JPEG / HEIC
- ESLint circular-config tooling debt
- global disabled-primary token polish

Not lifecycle release blockers.

# Severity Summary

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |
| release-blocking P2 | 0 |
| accepted P3 | 0 (lifecycle) |

# Final Certification

**PRODUCT LIFECYCLE CERTIFIED END-TO-END**

Archive / Restore / Permanent Delete closed for V1.

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1**

# Release

**COMMIT / PUSH / DEPLOY: PAUSED**

Products package remains **LOCAL / UNDEPLOYED**.
