# ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1

## Result

**PASS — PRODUCT LIFECYCLE APPLICATION RUNTIME IMPLEMENTED / FINAL QA REQUIRED**

DB lifecycle contract unchanged. Application layer connects Archive / Archivados / read-only archived detail / Restore / Permanent Delete / post-commit image cleanup / consumer filtering.

## DB Baseline

- Migration: `supabase/migrations/20260916180000_products_removal_lifecycle.sql`
- SHA256: `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57` (unchanged)
- Remote history: `20260916195024_products_removal_lifecycle`
- RPC: `public.delete_product_permanently(uuid)` — LIVE / fingerprint unchanged (`81f2046de539d43db38aa583574d5486`)
- DB changed this phase: **0**

## Preflight

- Branch: `main`
- Large pre-existing undeployed Products package preserved
- No reset / stash / commit / push / deploy

## Source Census

Owners inspected and wired:

- Admin page / provider / toolbar / catalog / table / card / empty state
- `lib/products/admin.ts` + client-safe `admin-product-types.ts`
- Edit flyout + overrides panel `readOnly`
- Products actions (archive/restore/delete + mutation guards)
- Public catalog / public customization / order-validation
- Manual order options
- Customization admin selectors + assignment validation
- Image shared-ref cleanup (`removeProductImageIfUnreferenced` includes archived)
- `AdminToastProvider` for lifecycle feedback

## Living Audit Reconciliation

Current-state claims updated for:

- `archived_at` LIVE
- SKU unique LIVE (prior)
- Public visibility requires `is_available` + `archived_at IS NULL`
- Raw authenticated products DELETE denied
- Lifecycle DB LIVE; application IMPLEMENTED locally / UNDEPLOYED
- Final QA PENDING

Historical forensic blocks preserved.

## Lifecycle Runtime Model

Canonical: `archived = product.archived_at !== null`. Deleted = row absent. No client `is_archived` flag.

## Product Type Changes

`AdminProductListItem` / `AdminProduct` expose `archived_at: string | null` via `lib/products/admin-product-types.ts` (client-safe). Server `admin.ts` re-exports.

## Admin Query Contract

### Default

`archived_at IS NULL` (available + unavailable)

### Disponible (`status=active`)

non-archived + `is_available = true`

### No disponible (`status=inactive`)

non-archived + `is_available = false`

### Archivados (`status=archived`)

`archived_at IS NOT NULL` — composes with `q` / `categoryId` / `stock` / `page`

## Catalog Existence Count

`getAdminProductsCatalogCount` — ALL rows including archived (first-run Create signal).

`getAdminProductsActiveLifecycleCount` — non-archived only (only-archived empty UX).

## Empty-State Semantics

- Only-archived + default view: no Create auto-open; copy + Ver archivados / Crear
- Filtered zero: existing recovery via toolbar
- True zero rows: first-run Create may activate again

## Archived Collection

Desktop/mobile show **Archivado**; no availability toggle; open detail; Delete not on row/card.

## Archived Detail

Read-only fields/image; Advanced inspectable with `readOnly`; no Save; Restore + Delete.

## Read-Only Enforcement

UI + server: Save / availability / legacy update reject archived.

## Server Action Guards

- `saveProductEditDraftAction`
- `setProductAvailabilityAction`
- `updateProductAction` (legacy)

All deny when `archived_at IS NOT NULL`.

## Archive Action

`archiveProductAction` → UPDATE `archived_at=now()`, `is_available=false` where not archived. No Storage/config mutation.

## Restore Action

`restoreProductAction` → `archived_at=null`, `is_available=false`. No auto-publish.

## Permanent Delete Action

`deleteProductPermanentlyAction` → RPC only → post-commit image cleanup → cache invalidation.

## RPC Integration

`rpc("delete_product_permanently", { p_product_id })`. Handles `deleted=false` safely. No client `business_id` / `image_url` authority into RPC.

## Post-Commit Image Cleanup

After `deleted=true` only; uses RPC `image_url`; shared-ref then Storage remove.

## Shared Image Guard

`removeProductImageIfUnreferenced` queries all remaining products (active + archived).

## Storage Failure Semantics

DB delete remains; success + warning toast; no resurrection; caches still invalidated.

## Dirty Draft / Lifecycle Interaction

Dirty Archive/Delete → existing discard dialog → Seguir editando cancels / Descartar resets whole unified draft, keeps flyout, opens confirm. No autosave. Close intent vs lifecycle intent separated.

## Confirmation UX

Archive reversible wording; Delete irreversible; no typed name; `<dialog>` a11y; Escape closes confirm not flyout.

## Public Catalog

Explicit `archived_at IS NULL` (+ available / business rules).

## Preview

Uses public catalog contract — archived absent.

## Manual Order

Non-archived + available (+ eligibility).

## Customization Product Selectors

New targets exclude archived; existing archived relations preserved; remove allows archived target; new assignment rejects archived.

## Cache Invalidation

Archive/Restore/Delete: admin products + public catalog + public customization. Delete also `/admin/products/customizations`.

## Desktop / Mobile

Lifecycle section in flyout; collection archived presentation; no Delete on collection.

## Accessibility

Dialogs, focus return, Escape ownership, >=44 touch, toast `role=status` via AdminToastProvider.

## Responsive QA

Source + CSS contracts; browser matrix deferred to FINAL-QA-1.

## Theme QA

Token-based lifecycle styles; browser light/dark deferred to FINAL-QA-1.

## Runtime QA

SOURCE / focused verify / mutation probes PASS. Disposable browser Archive/Restore/Delete/Storage QA: **DEFERRED to FINAL-QA-1** (no merchant mutation this phase).

## Network QA

Contract: pre-confirm writes 0; one Archive UPDATE; one Delete RPC; Storage after RPC. Browser observation deferred.

## Storage QA

Shared-ref includes archived (source + probe D). Disposable object QA deferred to FINAL-QA-1.

## Verification

- Focused: `lib/products/admin-products-product-removal-lifecycle-implementation.verify.ts` PASS
- Probes A–H FAIL_OK → restore PASS
- Related verifies reconciled PASS
- tsc PASS
- production build PASS
- `git diff --check` PASS (CRLF warnings only)

## Mutation Probes

A–H executed; sources restored.

## Regression Checks

Create unchanged; unified Edit/Save preserved; Advanced hierarchy/motion preserved; Builder architecture preserved except target eligibility.

## DB Immutability

Migration SHA unchanged; RPC fingerprint unchanged; RLS/history untouched.

## Data Safety

Merchant mutations 0; QA fixture residue 0 (no disposable browser fixtures created); schema/RLS/RPC/history 0.

## Remaining Debt

- End-to-end browser FINAL-QA matrix (360–desktop, themes, keyboard, disposable Storage/shared-image, only-archived tenant UX)
- Deploy of undeployed Products package still PAUSED

## Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1**

## Release

**COMMIT / PUSH / DEPLOY: PAUSED**
