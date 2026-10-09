# ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DECISION-1

## Result

**PASS — DECISION COMPLETE**

Unified Edit draft contract approved from post-accordion source.  
**Runtime source edits this phase: 0.**  
**Current runtime remains legacy mixed persistence until an implementation phase.**

---

## Current Runtime Architecture

### Base Save

| Step | Owner |
|------|--------|
| Submit | `EditProductForm` → `useActionState` → `editProductFormAction` |
| Server | `updateProductAction` (`app/admin/(protected)/products/actions.ts`) |
| Fields | `product_id`, `name`, `category_id`, `description`, `price`, `sku`, `stock`, `is_available`, `track_stock`, `image_intent`, optional `image_path` |
| Validation | manageProducts + required fields + `validateCategoryOwnership` + product ownership SELECT |
| DB | **One** `products.update` — **no** Postgres transaction |
| Image | REPLACE: client Storage upload **before** action; cleanup new on DB fail; cleanup old after DB success (non-fatal if cleanup fails) |
| Success | `revalidatePath("/admin/products")` + `revalidatePublicCatalogCache(scope: "catalog")` + client `router.refresh()` + `closeFlyout` |
| Failure | flyout stays open; draft remains (base dirty model) |

### Customization persistence (current)

| Concern | Evidence |
|---------|----------|
| Table | `product_customization_overrides` |
| Hidden | **Row exists** with `is_enabled: false` |
| Restore | **DELETE** row (return to inheritance) |
| Actions | `disable*` / `restore*` group & option in `customizations/actions.ts` |
| UI | `ProductCustomizationOverridesPanel` — immediate `useActionState` + `reload()` + `router.refresh()` |
| Consumers | Edit flyout **and** `/admin/products/customizations` builder |
| Auth | `manageProducts` + product ownership; disable also `assertGroupAppliesToProduct` |
| Cache | `revalidateCustomizationPaths` → admin customizations + products + public `scope: "customization"` |
| Atomic with product | **No** — separate round-trips |

### Dirty (current)

- `EditProductSnapshot` includes base fields + `categoryId` + `imageIntent`
- Customization **outside** snapshot (verified)
- Close/Escape/backdrop: discard confirmation for base dirty only

### Sticky (current)

- `.editActions.actionsSticky` sticky at bottom of flyout `.body`
- Customization mounts in `editAfterForm` **after** sticky footer → Save **releases** when scrolling Advanced
- Edit-only `headerReleaseClip` / `bodyReleaseClip` cover blue CTA remnant (CASE A) — correct under **old** ownership

### Accordion (current — PRESERVE)

- Avanzado collapsed by default; exception count when >0; one group open; Eye/EyeOff; no nested scroll
- Local UI state only for disclosure

### Category Edit (current)

- Required `<select name="category_id">`
- In dirty snapshot; always sent on update; server re-validates ownership and writes `category_id`

### Remount

- `EditProductForm key={selectedProduct.id}` in `flyout-panel.tsx` — product switch remounts form (primary reset)

### Preflight

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| Working tree | **PRE-EXISTING DIRTY** (large Products package) |
| This phase permanent runtime edits | **0** |
| This phase permanent docs | decision + CURRENT_PHASE + living audit + ORDEROPS_LIVING_MEMORY |

---

## Approved Product Decisions

### Unified Edit Draft

ONE EDITOR = ONE DRAFT = ONE SAVE.

Editable draft includes:

- name, description, price, sku, stock, isAvailable, trackStock
- imageIntent (+ staged replace file metadata as today)
- groupOverrides (semantic hide-here set)
- optionOverrides (semantic hide-here set)

`"Guardar cambios"` validates and persists the complete draft.

### Category Immutable In Normal Edit

- **CREATE:** `category_id` REQUIRED + EDITABLE (unchanged)
- **EDIT:** `category_id` = persisted read-only context; **not** in mutable draft
- Application-level immutability only — **no** DB trigger/constraint making category permanently immutable

### Future Move-Category Operation

**DEFERRED / SEPARATE PRODUCT OPERATION.**  
Not part of Edit, unified draft, this roadmap’s implementation phases, or any hidden endpoint now.

Would later own inheritance reconciliation, override compatibility, confirmations, cleanup, cache invalidation.

---

## Current Category Wiring

| Concern | Current | Future (implementation) |
|---------|---------|-------------------------|
| Control | `<select name="category_id" required>` | Read-only presentation (e.g. plain text “Categoría / HAMBURGUESAS”); prefer **not** a disabled select unless a11y forces it |
| Local state | `selectedCategoryId` in dirty snapshot | Remove from mutable draft / snapshot |
| FormData | `category_id` submitted | **Absent** from mutable payload (or ignored if present) |
| Action | Requires + `validateCategoryOwnership` + writes `category_id` | Resolve `category_id` from **persisted product row**; never accept reassignment |
| Required asterisk | Yes in Edit | No for category in Edit |
| Likely Edit required set | Nombre · Precio · Stock actual | Prove via implementation; Create keeps Categoría required |
| Verifies | dirty snapshot `categoryId`; simple-mobile `requiredFieldLabel("Categoría")` | **SUPERSEDED** for Edit category editable/required |

Server still uses persisted `category_id` as inheritance / override validation context.

---

## Canonical Persisted Context

```txt
EditProductContext (not draft):
  productId
  businessId
  categoryId          ← persisted, read-only in Edit
  categoryName?       ← display
  imageUrl?           ← baseline image reference
```

Identity / tenancy / category are **context**, not editable draft values.

---

## Unified Baseline Model

Loaded once when Edit opens (from product row + inheritance overrides):

```txt
UnifiedBaseline {
  name, description, price, sku, stock,
  isAvailable, trackStock,
  imageIntent: "keep",          // semantic baseline image state
  imageUrl: string | null,      // persisted reference for KEEP/REMOVE compare
  hiddenGroupIds: Set<GroupId>, // from override rows is_enabled=false, type=group
  hiddenOptionIds: Set<OptionId>
}
```

Normalization:

- Override representation: **presence of disable row** ⇒ hidden; absence ⇒ inherited visible
- Equality ignores array order (use sorted ids / Sets / Maps)
- Do **not** store accordion state in baseline

---

## Unified Draft Model

```txt
EditUnifiedDraft {
  name, description, price, sku, stock,
  isAvailable, trackStock,
  imageIntent: "keep" | "replace" | "remove",
  replaceFile? / image_path staging (as today),
  hiddenGroupIds: Set<GroupId>,
  hiddenOptionIds: Set<OptionId>
}
```

Excluded from draft:

- productId, businessId, categoryId
- created_at / updated_at
- advancedOpen, expandedGroupId
- inherited catalog metadata (group names, prices) — display from loaded inheritance, not draft

---

## Dirty Semantics

```txt
isDirty = !semanticUnifiedDraftEqual(current, baseline)
```

| Interaction | Dirty? |
|-------------|--------|
| Open/close Avanzado | No |
| Open/close/switch group accordion | No |
| Eye → EyeOff (differs from baseline) | Yes |
| EyeOff → Eye restoring baseline | Clears that delta |
| Name/price/stock/availability/track_stock change | Yes |
| Revert field to baseline | Clears that delta |
| Image KEEP | Pristine image dimension |
| Image REMOVE / REPLACE | Dirty image dimension |
| Category | N/A — not editable |

Pristine ⇒ Save disabled; block client submit; **no** server request.

---

## Customization Draft Semantics

Domain representation (proven):

- Hidden here = override row with `is_enabled: false`
- Visible / inherited = **no** override row
- Actions never write `is_enabled: true`

### Groups / options

Draft stores **desired hidden id sets** only.

| Draft state | Persist on Save |
|-------------|-----------------|
| id in hidden set, not in baseline | INSERT disable row (or UPDATE existing to false) |
| id in both draft hidden and baseline hidden | NO-OP |
| id in baseline hidden, not in draft hidden | DELETE override row |
| id in neither | NO-OP |

### Group hidden + child overrides

**No invented cleanup.** Current domain allows both rows to coexist; public resolve skips whole group when group disabled; admin exception count sums both.

Future draft/persist: preserve independent group and option override rows; do not auto-delete children when hiding a group.

### Eye / EyeOff Contract (target)

- Mutate **local draft only**
- Pre-Save: **0** server actions, DB writes, router.refresh, cache invalidation, Storage
- Icon = current **draft** visibility
- `aria-label` describes action (existing copy patterns)

Edit panel **stops calling** disable/restore actions.  
Those actions remain for Customizations builder until a later deprecation decision.

### Exception Count

**Current:** count every `group.isDisabledForProduct` + every `option.isDisabledForProduct`.

**Target:** same semantics from **draft**:

```txt
activeExceptionCount =
  hiddenGroupIds.size + hiddenOptionIds.size
```

(Derived from current draft, not only baseline.)  
Parent+child both count if both hidden — matches current UI.

---

## State Ownership

### Recommended: **OPTION A** (+ colocated pure helpers)

`EditProductForm` owns:

- unified baseline + current draft
- dirty equality
- Save / discard
- passes draft customization state + setters into `ProductCustomizationOverridesPanel`

Colocated pure module (e.g. under `lib/products/` or beside form) for:

- `buildUnifiedBaseline`
- `semanticUnifiedDraftEqual`
- `buildSavePayload`

### Rejected

| Option | Why |
|--------|-----|
| **B** standalone hook as sole owner | Acceptable variant of A; prefer A as primary owner with optional extracted hook **inside** Edit feature, not a new global state lib |
| **C** `ProductsManagementProvider` | Provider bloat; wrong semantic owner; harder testability |

Accordion UI state stays inside panel (or lifted only if needed); must reset on `productId` (remount via `key` already helps).

---

## Persistence

### Recommended server owner

**Dedicated unified Edit action** (name TBD, e.g. `saveProductEditDraftAction`) called only from Edit:

1. Auth `manageProducts`
2. Load product by id + business → **persisted `category_id`** (ignore client category)
3. Validate editable product fields (reuse current helpers)
4. REPLACE: ensure image path ownership / folder = productId (as today)
5. Call **Postgres RPC** for atomic product + overrides
6. On RPC success: image cleanup + unified cache invalidation
7. On RPC failure: cleanup new upload if any; return error

Prefer **not** overloading Create paths. Extending `updateProductAction` is acceptable only if Create remains unreachable and category write is removed — dedicated action is clearer.

### Payload strategy: **OPTION A — canonical desired state**

Client submits:

- editable product fields + image intent/path
- `hidden_group_ids: string[]`
- `hidden_option_ids: string[]`

Server reconciles DB diff.  
Scale: assignments are category/product scoped; practical N is small (tens of options); full canonical sets are safe. No premature pagination.

### Category authority

Browser is **not** authoritative for `category_id`.  
Server uses persisted product category for inheritance validation of submitted override ids.

### ID validation

Reuse / harden `getProductCustomizationInheritanceForAdmin` (or shared pure extract):

- each `group_id` must apply to product via current assignments for **persisted** category/product
- each `option_id` must belong to an applicable group’s options
- reject unknown / cross-tenant / non-applicable ids with safe domain error; **DB writes = 0**

---

## Atomicity

**ATOMIC DB SAVE REQUIRES RPC / POSTGRES FUNCTION**

Evidence:

- Current product update = single statement, no txn wrapper
- Override mutations = separate statements
- Sequential Supabase JS calls ≠ atomic
- Repo pattern for multi-table atomicity: **SECURITY DEFINER** RPCs (`create_order`, `transition_order_status`)

Partial-write risk without RPC: product updated + overrides failed (or inverse) → public catalog inconsistency.

---

## RPC / Migration Decision

**MIGRATION REQUIRED**

### Conceptual object

`public.save_product_edit_draft(...)` (name flexible)

| Concern | Requirement |
|---------|-------------|
| Security | **SECURITY DEFINER** + locked `search_path` — needed so product UPDATE + override INSERT/DELETE share one PL/pgSQL transaction (INVOKER alone cannot batch via PostgREST) |
| Auth | `auth.uid()` → profiles → business_id; role equivalent to manageProducts (owner/manager); reject others |
| Product | `id` + `business_id` match; load persisted `category_id` internally |
| Inputs | product editable columns; image_url intent result; arrays of hidden group/option ids |
| Work | UPDATE products (without accepting category reassignment); reconcile overrides to match desired hidden sets |
| Return | success payload / error raise |
| Rollback | any exception aborts entire txn |

### Why DEFINER

Same rationale as `create_order`: multi-statement atomicity under one SECURITY DEFINER function with explicit authz — not a security downgrade if hardened.

### Hardening checklist

- explicit `auth.uid` + profile business resolution
- manageProducts-equivalent role gate
- target product business match
- qualified table names + fixed `search_path`
- no client-supplied `business_id` / `category_id` authority
- validate override ids against persisted category context inside function or via pre-validated args checked again in SQL

### Rollback concept

Drop function / revert migration in a follow-up migration; no data backfill required for empty semantic change.

### DB apply

Separate phase: **ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1**  
(after authoring migration; before or gated against implementation Final QA)

---

## Security / RLS

- Table RLS on `products` and `product_customization_overrides` remains
- DEFINER RPC must not rely on RLS alone — enforce authz inside function
- Public read path unchanged (`resolveGroupsForProduct`)
- No RLS rewrite required for this contract if RPC is correctly gated

---

## Customization ID Validation

Server (pre-RPC and/or inside RPC):

1. Product ∈ authorized business  
2. `category_id` = persisted only  
3. Hidden group ids ⊆ applicable inheritance groups  
4. Hidden option ids ⊆ options of applicable groups  
5. Invalid → domain error; transaction not started / aborted; writes = 0  

---

## Override Reconciliation

For each product:

1. Load existing override rows (group + option, `is_enabled = false`)
2. Desired hidden sets from payload
3. To add → INSERT (`is_enabled: false`, correct shape: group has `group_id`; option has `option_id`, `group_id` null)
4. To remove → DELETE matching row
5. Never touch other products/businesses

---

## Image / Storage Compensation

Storage ∉ SQL transaction. Preserve current lifecycle.

| Intent | Flow |
|--------|------|
| KEEP | No upload; omit image_url in product update |
| REPLACE | Optimize client-side → upload at Save → pass path → RPC sets URL → on RPC fail cleanup **new**; on success cleanup **old** if unreferenced |
| REMOVE | RPC sets `image_url = null` → after success cleanup old if unreferenced |

Pre-submit Storage uploads: **0** (frozen).

| Failure | Expected |
|---------|----------|
| Client optimize fail | DB 0; dirty remains |
| Upload fail | DB 0; dirty remains |
| RPC validation / unexpected fail | DB 0; cleanup new upload if any; dirty remains; flyout open |
| RPC success + old cleanup fail | Save **success** (current contract); log; lifecycle debt unchanged |
| Invalid group/option ids | Domain error; DB 0 |
| Network interrupt | No false success; draft remains |

---

## Save Success

On unified success:

- product + overrides committed atomically
- image reference committed
- invalidate admin products + public catalog **and** customization tags (union of today’s product + customization invalidation)
- `router.refresh()`
- `closeFlyout`
- no discard prompt

---

## Save Failure

- flyout remains open
- entire local draft intact (base + customization + image intent)
- `isDirty` true
- accordion UI state may remain
- error via existing Edit feedback owner
- no partial DB state if RPC approved

---

## Discard Contract

Dirty = any semantic unified delta (including Eye/EyeOff draft changes).

Close / Escape / backdrop → confirm discard whole draft.  
“Seguir editando” → keep all.  
“Descartar” → drop local draft only (no customization DB writes under target model).

---

## Sticky Footer Decision

### Current

Base sticky; releases before Advanced; release-lip mitigates remnant — **correct for old ownership**.

### Approved target

Save owns **entire** editor → sticky must remain available through Advanced / open group / options.

### Implementation geometry (future)

1. Move customization panel **inside** the Edit form scroll content **above** `.editActions.actionsSticky` (not `editAfterForm` after footer)
2. Keep single flyout `.body` scroll owner; no nested scroll
3. Preserve bottom padding so last option clears sticky CTA (~safe-area + footer height)
4. After sticky spans full editor, **Edit release-lip (`headerReleaseClip` / `bodyReleaseClip`) becomes likely unnecessary** — remove only after remnant regression proof; Create stays unchanged
5. Classify sticky-release phase as **SUPERSEDED BY UNIFIED EDITOR SAVE OWNERSHIP** (historically PASS, not a mistake)

---

## Cache / Public Catalog

Unified Save success should invalidate **once** the union of:

| Current product Save | Current override mutation |
|----------------------|---------------------------|
| `revalidatePath("/admin/products")` | + `/admin/products/customizations` |
| `revalidatePublicCatalogCache(scope: "catalog")` | `scope: "customization"` |

Recommended: one helper call that touches catalog + customization tags + admin products (+ customizations admin path).

Public coherence: product fields + availability + group/option overrides become visible together after one commit — eliminates sequential partial visibility risk.

---

## Existing Action Census

| Symbol | Call sites | Class | Future |
|--------|------------|-------|--------|
| `disableProductCustomizationGroupOverrideAction` | Overrides panel only | Shared (Edit + Customizations builder) | **STOP USING FROM EDIT**; **KEEP** for builder |
| `restoreProductCustomizationGroupOverrideAction` | same | Shared | same |
| `disableProductCustomizationOptionOverrideAction` | same | Shared | same |
| `restoreProductCustomizationOptionOverrideAction` | same | Shared | same |
| `loadProductCustomizationInheritanceAction` | panel reload | Shared | **KEEP** for initial load / post-Save refresh; not for Eye clicks |
| `updateProductAction` | Edit form | Edit | **REPLACE / EXTEND** into unified Save action |
| `getProductCustomizationInheritanceForAdmin` | loader + assert | Shared lib | **KEEP** / reuse for validation |

Public does not call mutation actions.

---

## Verify Census

| Verify | KEEP | UPDATE | SUPERSEDED |
|--------|------|--------|------------|
| dirty-state | equality/discard/close a11y; image intents | snapshot shape → unified; **remove** “overrides outside dirty” | categoryId in snapshot |
| simple-mobile parity | sticky mobile CTA; stock labels; no Activo/Inactivo | required set without Categoría; category read-only UI | `requiredFieldLabel("Categoría")` |
| sticky-footer release | Create untouched; single scroll | — | Edit release-lip **required**; release-before-customization DOM order |
| density (reconciled) | actions exist; no nested scroll; 44px | Eye local-only vs server actions | immediate action wiring from Edit |
| accordion | disclosure defaults; single-open; nesting; a11y | Eye no longer posts forms in Edit | “independent immediate actions” if asserted as Edit persistence |
| flyout interaction | a11y/focus/dirty close | — | — |
| image-lifecycle | KEEP/REPLACE/REMOVE; pre-submit 0 | wire to unified Save | — |
| stock-availability | trigger/helpers | — | — |

Historical docs remain PASS evidence; mark stale asserts:

**STALE DUE TO APPROVED PRODUCT-CONTRACT SUPERSESSION**

---

## Superseded Contracts

(Approved to supersede — **not yet implemented**)

| Old contract | Status |
|--------------|--------|
| Customization outside base dirty | TO BE SUPERSEDED |
| Eye/EyeOff immediate persistence | TO BE SUPERSEDED |
| Customization actions independent from Save | TO BE SUPERSEDED (Edit path) |
| Guardar cambios owns base only | TO BE SUPERSEDED |
| Sticky releases before customization | TO BE SUPERSEDED |
| Edit category required/editable | TO BE SUPERSEDED |

Accordion presentation / mapping / Eye visual / one-open / no nested scroll: **PRESERVE**.

---

## Recommended Implementation Roadmap

1. **ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-AUTHOR-1**  
   Author migration for `save_product_edit_draft` (or equivalent). No remote apply. No UI.

2. **ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1**  
   Apply migration to target DB. Verify execute grants / authz smoke. No UI.

3. **ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1**  
   Unified draft ownership in Edit; category read-only; Eye local-only; dedicated Save action → RPC; sticky DOM reorder; cache union; reconcile verifies with mutation probes. Accordion preserved.

4. **ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1**  
   Runtime matrix; atomicity failure probes; sticky remnant; Create category regression; data safety.

Optional split of (3) only if blast radius forces it — prefer one implementation phase after DB exists.

**Not next:** product removal (remains deferred relative to this track unless owner reprioritizes).

---

## Data Safety (this phase)

| Domain | Mutations |
|--------|-----------|
| products | 0 |
| customizations | 0 |
| categories | 0 |
| Storage | 0 |
| orders | 0 |
| DB schema / RLS / migrations applied | 0 |

Read-only source/schema inspection only.

---

## Runtime Changes

**0**

---

## Concurrency (note)

Current model: last-write-wins; no product row versioning.  
Unified Save slightly widens lost-update surface (overrides + product together) but does not introduce a new class of bug beyond today’s independent races.  
**No optimistic locking in this contract** unless later integrity phase requires it. Record as accepted debt.

---

## Next

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-AUTHOR-1**

---

## Release

**COMMIT / PUSH / DEPLOY: PAUSED**
