# ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1

## Result

**PASS — UNIFIED EDITOR RUNTIME IMPLEMENTED**

ONE EDITOR = ONE DRAFT = ONE SAVE is wired in application source against the already-certified RPC `public.save_product_edit_draft`.

## Preflight

| Item | Value |
|------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| pre-existing dirty | large Products worktree preserved (not reset/stashed) |
| this-phase delta | Edit unified draft runtime + verifies/docs only |

## DB Precondition

| Gate | Status |
|------|--------|
| ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1 | **PASS — RPC LIVE / VALIDATED** |
| RPC | `public.save_product_edit_draft` |
| Security | SECURITY INVOKER |
| Migration file SHA256 | `42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631` (unchanged) |
| Schema/RLS/migration edits this phase | **0** |

## Runtime Delta

| Area | Change |
|------|--------|
| Helper | `lib/products/edit-unified-draft.ts` — canonicalize/equal/toggle/exception count |
| Edit form | `components/admin/products/edit-product-form.tsx` — owns unified draft |
| Panel | dual mode `immediate` (builder) / `draft` (Edit) |
| Action | `saveProductEditDraftAction` → RPC |
| CSS | category read-only; sticky clearance for Advanced inside form |
| Flyout | Edit release-lip classes no longer applied |
| Verifies | new implementation verify + reconciled superseded asserts |

## Previous Runtime

Historical (superseded):

- Base Save via `updateProductAction` + immediate Eye disable/restore actions
- Customization after sticky footer (`editAfterForm`)
- Edit category editable select
- Dirty excluded customization overrides
- Release-lip required because sticky ended before Advanced

## Unified Draft Architecture

`EditProductForm` owns `persistedBaseline` + current field/image/hidden-id state.

`ProductCustomizationOverridesPanel` (`mode="draft"`) loads inheritance once, reports baseline via callback, and toggles local hidden sets only.

## State Ownership

**OPTION A** — feature-local in EditProductForm. No Zustand / provider store for draft.

## Canonical Baseline

Baseline = persisted product fields + `imageIntent=keep` + hidden group/option ids from inheritance loader (`isDisabledForProduct`).

Do not infer customization baseline before load success (`ready` / `empty`).

## Customization Readiness

| State | Save |
|-------|------|
| loading | disabled |
| error | disabled + visible error |
| ready / empty | normal dirty/valid gates |

Loader ownership: **panel loads once; parent does not duplicate fetch** (pattern B).

## Dirty Semantics

`isDirty = !unifiedEditDraftEqual(current, persistedBaseline)`

Includes: name, description, price, sku, stock, availability, trackStock, imageIntent, hiddenGroupIds, hiddenOptionIds (set semantics).

Excludes: categoryId, productId, accordion/disclosure UI.

## Category Read-Only Contract

Create: editable + required (unchanged).

Edit: label **Categoría** + persisted name (`categoryReadOnlyValue`). No `select[name=category_id]`. Not dirty. Not in save payload.

## Customization Draft Contract

Canonical desired sets: `hidden_group_ids` / `hidden_option_ids` via repeated FormData entries.

Parent-hidden does not erase child option overrides.

## Eye / EyeOff

Edit draft mode: `type="button"` local toggles only.

Pre-Save customization writes: **0**.

## Exception Count

Derived from **current draft** hidden group + option counts.

## Unified Save Action

`saveProductEditDraftAction`:

1. `requireAdminPermission("manageProducts")`
2. Validate base fields (no category)
3. Canonicalize hidden UUID sets
4. Image path validation for REPLACE
5. `supabase.rpc("save_product_edit_draft", …)`
6. Post-success image cleanup + cache union
7. Safe SKU + RPC domain error mapping

## RPC Wiring

Payload: `p_product_id`, base fields, `p_image_intent`, `p_image_url`, `p_hidden_group_ids`, `p_hidden_option_ids`.

Not sent as client mutation authority: `business_id`, `category_id`.

## Image Compensation

KEEP / REMOVE / REPLACE preserved. REPLACE uploads at Save; failure cleans new upload via `cleanupPendingProductImageAction`. Old cleanup after DB success only.

## Save Success

revalidate → `router.refresh()` → `onSuccess` / close. No discard prompt. No second override save.

## Save Failure

Flyout stays open; draft preserved; no premature baseline reset.

## Discard Contract

Dirty (base / image / group / option) → confirm. Accordion-only → immediate. Discard closes without persistence.

## Sticky Footer Ownership

Advanced is **inside** the form **above** sticky Guardar. Sticky spans Advanced. Release-lip Edit wiring superseded (CSS left inert).

## Cache Invalidation

Union once: `/admin/products`, `/admin/products/customizations`, public `catalog` + `customization`.

## Action Census

| Action | Consumer | Status |
|--------|----------|--------|
| `saveProductEditDraftAction` | Edit Product | **ACTIVE** |
| `updateProductAction` | none (Edit removed) | **LEGACY retained** (historical grep / image verify) |
| group/option disable+restore | customization builder (immediate panel) | **ACTIVE** — Edit consumer **NO** |
| `loadProductCustomizationInheritanceAction` | panel baseline loader | **ACTIVE** |

## Create Regression Guard

Create category editable/required + sticky + image + stock defaults untouched.

## Builder Regression Guard

`owner-customization-builder` still mounts panel default `immediate`.

## Verify Reconciliation

New: `lib/products/admin-products-edit-unified-draft-save-implementation.verify.ts`

Superseded runtime asserts updated in dirty / sticky / accordion / density / simple-mobile / flyout / required-affordance / image verifies. Historical markdown left intact.

Mutation probes A–D: FAIL → restore → PASS.

## Browser QA

Non-mutating (0 Save confirms):

| Viewport | Evidence |
|----------|----------|
| 390 | category read-only; Save disabled; sticky 48px; overflowX 0 |
| 412 | overflowX 0; Save disabled pristine |
| desktop | Eye local dirty/revert; discard → Seguir editando; accordion collapse keeps draft; sticky; no blue remnant under header |

Eye toggles: **0** customization mutation network posts observed.

## Data Safety

products / overrides / categories / profiles / Storage / orders / schema / RLS / RPC / migration history mutations during QA: **0**.

## Remaining Debt

- Remove inert `headerReleaseClip` / `bodyReleaseClip` CSS in a cleanup phase
- Remove or fully retire `updateProductAction` once no verify depends on it
- `types/database.ts` still lacks RPC typings (narrow cast in action)

## Next

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1**

COMMIT/PUSH/DEPLOY: **PAUSED**
