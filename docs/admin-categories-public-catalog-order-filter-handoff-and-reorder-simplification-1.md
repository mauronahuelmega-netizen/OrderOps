# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FILTER-HANDOFF-AND-REORDER-SIMPLIFICATION-1

## Result

**PASS — PRODUCT FILTER HANDOFF + CATEGORY FILTER UNITY CLOSED / REORDER INPUT SIMPLIFIED TO MOVE CONTROLS / ATOMIC SAVE CONTRACT PRESERVED / FINAL QA NEXT**

## Trigger

Owner real-device QA on Products filters + Category Order:

1. Category filter felt heavier than Stock/Estado (modal for simple filter).
2. Grip + Pointer drag created mobile friction; Subir/Bajar already worked.
3. Cross-filter handoff required a second tap (Stock open → tap Estado → Stock closed, Estado did not open).

## Owner Real-Device Findings

| Finding | Owner observation | Correction |
|--------|-------------------|------------|
| Category filter weight | Modal/dialog for filtering | Compact anchored menu (Stock/Estado family) |
| Drag friction | Grip + Pointer Events drag | Remove grip/drag; Subir/Bajar only |
| Handoff | Close animation wiped next open | Single toolbar `openFilter`; direct switch |

## Superseded Interaction Contracts

### SUPERSESSION A — Filter presentation

**HISTORICAL / SUPERSEDED BY OWNER QA:** Category Filter + Order shared one native dialog with two modes (`filter` / `order`).

**CURRENT:** Category filtering = compact anchored menu. Category Order = dedicated order-only `<dialog>`.

### SUPERSESSION B — Reorder input

**HISTORICAL / SUPERSEDED BY OWNER QA:** GripVertical + Pointer Events drag + Subir/Bajar.

**CURRENT:** Subir/Bajar only. Grip, pointer capture, drag threshold, grab cursors removed. Positional FLIP reflow retained for move controls.

Historical phase docs (IMPLEMENTATION / PRE-FINAL visual / MOTION+FILTER UNITY) retain prior wording as historical; live verifies for those phases are stubs pointing here.

## Preserved Domain Contracts

Unchanged:

- Migration `20260917210150_categories_public_catalog_order.sql`
- Append trigger / RLS / position privileges
- RPC `save_category_display_order(uuid[])`
- `saveCategoryDisplayOrderAction` / orderedCategoryIds-only payload
- Semantic dirty / local draft / Cancel discard / Save success·error / stale-set
- Cache invalidation / public configured order / product order
- Category create append / Edit category read-only / `/admin/categories` no-ordering V1
- Filter URL authority / server-side product filtering

## Source Forensic

| Surface | File |
|--------|------|
| Open-filter owner | `products-toolbar.tsx` — `openFilter: "category" \| "stock" \| "status" \| null` |
| Compact menu | `compact-products-filter-menu.tsx` + `.module.css` |
| Order dialog | `category-order-dialog.tsx` + `.module.css` (renamed from legacy filter+order) |
| Reflow | `lib/categories/category-order-reflow-motion.ts` |
| Draft / helper copy | `lib/categories/category-order-draft.ts` |

Legacy `category-filter-order-dialog.*` deleted (not dual-implemented).

## Handoff Root Cause

**Previous open-state owner:** each compact menu (and/or a single `simpleMenu` string) treated close as authoritative, and exit animation completion called parent `onOpenChange(false)` / `setSimpleMenu(null)`.

**Outside event behavior:** document outside-pointer closed the active menu; tapping another filter trigger was sometimes treated as outside-close **before** the destination trigger could own the same gesture, or exit finish cleared the newly set open key.

**Why second tap occurred:** Stock began exit and eventually forced logical open to `null`, wiping Estado’s open that had been requested in the same interaction — user had to tap Estado again.

## Open Filter Ownership

- **Logical owner:** `ProductsToolbar` — single `openFilter`
- **State shape:** `OpenProductFilter = "category" | "stock" | "status" | null`
- **Presence owner:** each `CompactProductsFilterMenu` local `mounted` / `exiting`
- **Exiting interaction:** `pointer-events: none`, `aria-hidden`, `tabIndex=-1`; exit finish does **not** call `onRequestClose`
- **Outside click:** ignore targets inside any `[data-products-filter]`; only genuine outside → `onRequestClose` for the active key

## Presence / Exit Model

- `open === true` → mount, enter ~140ms, interactive
- `open === false` while mounted → exiting ~110ms, non-interactive immediately
- Reduced motion → unmount immediately
- Handoff: `setOpenFilter(next)` direct; no wait-for-exit; no setTimeout open; no synthetic click

## One-Tap Handoff

Trigger contract:

- own closed → open
- own open → close
- other open → switch directly to this key

## Category Compact Filter Menu

- Trigger closed empty: **Categorías** (`emptyTriggerLabel`)
- Options: Todas + tenant categories (configured order)
- Separator + trailing action **Ordenar categorías** (not `role="option"`)
- Immediate URL filter; no backdrop; no modal footer
- `menuWide` for longer labels (~240–300px bounded)

## Category Order Action

One tap:

1. `setOpenFilter(null)` (menu exits)
2. open order dialog
3. draft from persisted order
4. preserve `categoryId` / q / stock / status
5. 0 writes

## Order-Only Dialog

- Title: Ordenar categorías
- No Filter mode
- Cancel / Escape: discard + close (no return to filter mode)
- Save success: close dialog; URL filter unchanged

## Removed Drag Contract

Removed: GripVertical, pointerdown/move/up drag, pointer capture, elementFromPoint reorder, touch-action:none grip, grab/grabbing, pressed/dragging row states, drag CSS.

## Move-Only Reorder Contract

Row: name (primary) + Subir/Bajar (≥44px). First Up disabled; last Down disabled; row ≥48px. No empty left grip column (`grid-template-columns: minmax(0,1fr) auto`).

## Helper Copy

Exact current:

`Usá las flechas para definir el orden del catálogo.`

(`CATEGORY_ORDER_HELPER_COPY` — no “Arrastrá” in current runtime.)

## Reflow Motion

Keep FLIP/WAAPI ~160ms on Subir/Bajar. Optional subtle `orderRowMoved` during animation. Reduced motion skips transforms. No drag-only helper APIs.

## Keyboard / Focus

Enter/Space on arrows = same `handleMove` path. Focus restored to the same category’s Up/Down control after DOM reorder.

## Cancel / Escape

Discard local draft + close order dialog. 0 writes. No Filter-mode transition.

## URL Semantics

Unchanged:

- Category: `categoryId` / delete; page reset; preserve q/stock/status
- Stock: `out|low|in`
- Status: `active|inactive|archived`
- Limpiar filtros → pathname
- Server filtering remains authority

## Responsive

Hard targets: 360 / 390 / 412 / short 390×640 / 768 / 899 / 900 / 1024 — compact menus + order dialog; Category menu viewport-clamped.

## Light / Dark

Tokens only (`--bg-surface`, `--text-*`, `--border-subtle`, `--shadow-floating`, accent mixes). No hardcoded chrome.

## Reduced Motion

Handoff still one-tap without animation dependency. Reorder: immediate DOM order; no WAAPI.

## Runtime Handoff QA

Source + architecture guarantees one-tap for all pairs. Emulated mobile Chrome / touch pointer: exercised where browser available. See Android Evidence.

## Android Evidence

**REAL ANDROID: NOT RUN BY CURSOR**

Mobile Chrome emulation / touch-pointer QA: required for owner confirmation on device.

## Runtime Order QA

No grip; helper updated; pristine Save disabled; local Subir/Bajar dirty/revert; **real Save executions this phase: 0**.

## Network Safety

Filter navigation: RSC only. Local reorder / Cancel / Escape: 0 mutation. Real Save: 0.

## Business Safety

Category rows / positions / products / orders / Storage: 0 delta this phase.

## Focused Verify

`lib/categories/admin-categories-public-catalog-order-filter-handoff-reorder-simplification.verify.ts`

## Mutation Probes

A–L: FAIL_OK → restore PASS (`VERIFY_PROBES=1`).

## TypeScript

`npx tsc --noEmit` — PASS

## Build

`npm run build` — PASS

## Diff

`git diff --check` — PASS (CRLF warnings only). No migration / action / RPC contract edits in this phase’s intent.

## Functional Delta

- Central `openFilter` handoff
- Category → compact menu + trailing Ordenar
- Order dialog rename/order-only
- Drag/grip removed; move-only + reflow

## DB Delta

**0**

## Remaining

REAL CATEGORY SAVE + PERSISTENCE + PUBLIC/ADMIN CHECK + EXACT RESTORE

## Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

## Release

COMMIT/PUSH/DEPLOY: **PAUSED**
