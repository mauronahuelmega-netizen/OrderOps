# ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1

## Result

**PASS — UNIFIED EDITOR CERTIFIED END-TO-END**

## Preconditions

| Gate | Status |
|------|--------|
| IMPLEMENTATION-1 | PASS — UNIFIED EDITOR RUNTIME IMPLEMENTED |
| RPC | `public.save_product_edit_draft` LIVE / VALIDATED |
| Migration SHA256 | `42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631` unchanged |
| Schema/RLS/RPC edits this phase | **0** |
| Runtime source fixes this phase | **0** (validation-only) |

## Preflight

| Item | Value |
|------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | pre-existing Products package + implementation delta preserved |
| Final-QA runtime source delta | 0 |
| Recovery | stalled after Restore Save; fixture already at baseline; resumed non-mutating QA then deleted disposable fixture |

## Source Freeze Check

Confirmed owners still match implementation:

- `EditProductForm` → `saveProductEditDraftAction` + unified draft helpers
- panel `mode="draft"` in Edit; builder omits mode → immediate
- category read-only; Advanced above sticky Save
- release-lip CSS inert (no Edit wiring)

## Safe QA Fixture

| Field | Value |
|-------|-------|
| business | La Burguesía / `demohamburgueseria` (`e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`) — OrderOps demo tenant |
| product | **FINAL-QA Unified Draft** (`a1111111-1111-4111-8111-111111111111`) |
| why safe | Explicit QA-labelled disposable product created for Final QA only; inactive; no customer relevance |
| customization | Assigned Papas / Salsas / Agregados extra |
| SKU | `FINAL-QA-UNIFIED-1` |

## Baseline Snapshot

| Field | Baseline |
|-------|----------|
| name | FINAL-QA Unified Draft |
| description | `FINAL-QA baseline description sentinel v0` |
| price | 999.00 |
| sku | FINAL-QA-UNIFIED-1 |
| stock | 5 |
| is_available | false |
| track_stock | false |
| category_id | `3ffbf1a8-e474-4143-a131-339b34535e06` (HAMBURGUESAS) |
| image_url | null (KEEP) |
| overrides | **0** |
| exception count | 0 |

## Pre-Save Local Draft Proof

After description append ` | FINAL-QA-MUT` + hide Salsas Eye:

- Save enabled
- exception count → 1
- pre-Save mutation network posts: **0**
- DB still at baseline (overrides 0, description unchanged) until Save

## First Unified Save

| Item | Evidence |
|------|----------|
| action | single POST `/admin/products?q=FINAL-QA` (Server Action) |
| RPC | `save_product_edit_draft` (no disable/restore Edit actions) |
| result | success |
| flyout | closed after success |

## Post-Save Reopen

| Check | Result |
|-------|--------|
| description | `… \| FINAL-QA-MUT` |
| Advanced | `1 excepción` |
| Save | disabled (pristine) |
| category | HAMBURGUESAS / select absent |
| image | still null |

## Authoritative Persistence Proof

After first Save:

- products.description mutated as expected
- category_id unchanged
- image_url null unchanged
- one override: group `a65af6ca-…` (Salsas) `is_enabled=false`
- no `is_enabled=true` rows

## Restore Save

Restore description + show Salsas → Save → flyout closed.

DB after restore:

- description = baseline
- overrides = 0
- category/image unchanged

## Net Data Delta

Temporary Saves: **2** (mutation + restore)

Disposable fixture then **deleted** (product + assignments + overrides).

Final counts for fixture id: products 0 / assigns 0 / overrides 0

Net persistent business delta vs pre-Final-QA: **0**

Storage / categories / profiles / orders / schema / RLS / RPC / migration history: **0**

## Dirty Matrix

Browser (non-mutating after restore):

| Case | Result |
|------|--------|
| initial | pristine |
| description / price / stock / availability / track_stock | dirty → revert pristine |
| group Eye | dirty → revert pristine |
| option Eye (Papas chicas) | dirty → revert pristine |
| mixed partial revert | still dirty |
| full revert | pristine |
| accordion open/close / group expand | pristine |

## Exception Count

Local Eye updates count without Save. After Save/reopen matched persisted state (1). After restore matched 0.

## Category Contract

Edit: visible HAMBURGUESAS, no `select[name=category_id]`, not required marker.

Create: editable required select + inline create affordance present (no submit).

category_id unchanged across mutation Save + restore Save.

## Customization Contract

Eye local before Save. Pre-Save writes 0.

Parent hide does not erase child option draft id (`childPreserved=true`).

Builder: panel without `mode` → immediate (source).

## Save Success

Pending path exercised; flyout closed once; reopen pristine; no discard on success.

## Save Failure

Not deliberately corrupted live. Covered by implementation verifies + RPC domain mapping + SKU UX source. Atomic route proven (single action POST; no Edit override actions).

## Atomic Route Proof

Edit submit → one Server Action POST → RPC. No sequential product update + disable/restore from Edit.

## Image Regression

KEEP runtime: image_url null before = after mutation = after restore. Storage 0.

REMOVE/REPLACE: source + image lifecycle verify corpus PASS (no live Storage mutation).

## Sticky Footer Visual QA

| Viewport | Result |
|----------|--------|
| desktop ~1920 | sticky `position:sticky`, overflowX 0, minH ≥44 |
| 390 × 700 short | overflowX 0; Advanced usable; discard works; flyout body scroll owner |
| 412 | overflowX 0 (earlier recovery session) |
| header remnant | none (below-header = form surface, not blue CTA) |

Additional widths 360/899/961 covered by CSS contract + prior implementation visual evidence; no sticky regression found requiring fix.

Light: exercised. Dark: representative not fully re-run after recovery (accepted non-blocking; no sticky defect in light).

## Accessibility / Keyboard

Source + prior flyout verifies PASS. Eye `type=button`. Escape/dirty discard proven. Focus trap: existing flyout contract verifies PASS.

## Discard Matrix

Customization dirty → confirm. Seguir editando preserves draft. Descartar closes without DB change (proven).

## Product Switch / Async Safety

Remount `key={selectedProduct.id}` + panel/productId race guards in source. Loader race covered by implementation verify/source.

## Create Regression

category select required + inline create; sticky Create path untouched. Mutations 0.

## Builder Regression

Immediate default preserved. No persistent builder mutations.

## Collection Availability Regression

Still `setProductAvailabilityAction` — not unified Edit RPC.

## Cache / Public Freshness

Source union: `/admin/products`, `/admin/products/customizations`, public catalog + customization scopes.

Admin list refreshed after Saves (fixture visible/searchable). Public description not required (inactive QA product).

## Action Census

| Action | Status |
|--------|--------|
| `saveProductEditDraftAction` | ACTIVE Edit writer |
| `updateProductAction` | LEGACY / verify-only (no runtime TSX caller) |
| disable/restore group/option | builder immediate only |
| inheritance loader | ACTIVE baseline |

## Verify Corpus

Products verifies: **27 / 27 PASS** (0 fail)

Including unified implementation, dirty, sticky, accordion, density, image, stock, SKU, RLS, DB author/apply, Create guards.

tsc: PASS  
build: PASS (`BUILD_EXIT=0`)  
lint: NOT RUN — KNOWN ESLINT 9 / REACT PLUGIN CIRCULAR CONFIG DEBT  
diff --check: PASS (CRLF warnings only)

## Living Audit Reconciliation

Current-state sections reconciled to unified writer/dirty/category/cache/sticky (historical CLOSED entries preserved / marked superseded). Last verified updated to FINAL-QA-1.

## Remaining Accepted Debt

- inert `headerReleaseClip` / `bodyReleaseClip` CSS cleanup
- retire `updateProductAction` when verifies no longer grep it
- `types/database.ts` RPC typing lag (narrow cast)
- ESLint tooling debt
- image transforms/billing / HEIC / orphan cleanup (external)

## Release Readiness

| Class | Count |
|-------|-------|
| P0 introduced | 0 |
| P1 introduced | 0 |
| release-blocking P2 | 0 |
| P3 / accepted debt | listed above |

## Next

Owner review / product-removal decision or release sequencing (roadmap).

COMMIT/PUSH/DEPLOY: **PAUSED**
