# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-MOTION-AND-FILTER-UNITY-POLISH-1

## Result

**PASS — CATEGORY REORDER MOTION + PRODUCTS FILTER FAMILY UNIFIED / FILTER SEMANTICS PRESERVED / FINAL QA NEXT**

## Trigger

Owner visual QA after Pre-Final visual polish: Category reorder needed tactile motion; Stock/Estado native `<select>` chrome read as legacy beside the custom Category trigger.

## Owner Authorization

Owner explicitly authorized superseding **only** the Stock/Estado **presentation** freeze (native selects) with simple custom compact filter menus, while freezing URL/server filter semantics and Category Order functional contract.

## Superseded Presentation Freeze

| Era | Presentation |
| --- | --- |
| HISTORICAL through IMPLEMENTATION-1 / PRE-FINAL-QA-VISUAL-POLISH-1 | Category custom dialog · Stock native `<select>` · Estado native `<select>` |
| CURRENT (this phase) | Category custom Filter/Order dialog · Stock simple custom menu · Estado simple custom menu |

Historical invariant is retained as **SUPERSEDED PRESENTATION**, not erased.

## Frozen Functional Contracts

Category Order: draft / dirty / grip Pointer Events / Subir·Bajar / Cancel / Escape / one Save → one RPC — **UNCHANGED**.

Filters: URL authority · `stock` / `status` values · page reset · q/category/other preservation · server-side filtering · no client product filtering — **UNCHANGED**.

## Source Ownership

| Area | Files |
| --- | --- |
| Toolbar | `products-toolbar.tsx`, `products-toolbar.module.css` |
| Simple menu | `compact-products-filter-menu.tsx`, `.module.css` |
| Category dialog | `category-filter-order-dialog.tsx`, `.module.css` |
| Motion helper | `lib/categories/category-order-reflow-motion.ts` |
| Verify | `lib/categories/admin-categories-public-catalog-order-motion-filter-unity-polish.verify.ts` |

## Filter Family Architecture

`ProductsToolbar` → CategoryFilterOrderDialog + CompactProductsFilterMenu(Stock) + CompactProductsFilterMenu(Estado).

Shared closed-trigger chrome via `filterSelect` / `filterSelectActive`. Explicit ChevronDown icons (no native select chevron image).

## Category Trigger

Custom dialog trigger preserved as reference; added open chevron rotation + `onOpenChange` to close simple menus. Not redesigned as CTA.

## Stock Menu

Button + anchored listbox. Options: Stock / Agotados / Bajo stock / Con stock. Immediate selection. No dialog/footer/Save/drag.

## Estado Menu

Same model. Options: Estado / Disponibles / No disponibles / Archivados. `menuAlign="end"` for viewport safety.

## URL Semantics

Shared `handleFilterChange` → `pushParams` deletes `page`, sets/deletes key. Runtime verified:

- `?stock=low`
- `?stock=low&status=active` (stock preserved)

## Keyboard / Focus

Triggers: Enter/Space/ArrowDown open. Options: arrows, Home/End, Enter/Space select, Escape closes + focus trigger, Tab closes without trap. Outside mousedown closes. Scroll/resize closes.

## Open / Close Motion

Open ~140ms opacity + translateY + slight scale. Close ~110ms. Chevron rotate ~140ms. Reduced-motion: instant.

## Reorder Pressed State

Grip pointerdown → `orderRowPressed` (scale ~0.99, stronger surface).

## Reorder Dragging State

After ≥4px move or row swap → `orderRowDragging` (scale ~1.01, restrained elevation). Grip grabbing.

## FLIP / Reflow Motion

`captureCategoryRowTops` before draft change · `useLayoutEffect` · `HTMLElement.animate` translateY delta → 0 · 160ms · skip active row · cancel prior animation by id.

## Keyboard Reorder Motion

Subir/Bajar uses same `captureReflowSnapshot` path.

## Settle Motion

Pointerup clears pressed/elevated; CSS transition returns to rest ~120ms.

## Reduced Motion

Helper skips WAAPI; CSS disables transforms/transitions/menu animations.

## Responsive

412 Stock/Estado menus + Category Order exercised. overflowX 0. Toolbar 3-col density preserved.

## Light / Dark

Menus use semantic surface tokens; dark mode verified (admin theme). No native white dropdown.

## Back / Forward

Labels derive from URL props (`stock`/`status` searchParams) — no independent persisted selection.

## Runtime Visual QA

- Closed unified triggers (dark + light surfaces)
- Stock open listbox · select Bajo stock → URL `stock=low`
- Estado open (closes Stock) · select Disponibles → `stock=low&status=active`
- Limpiar filtros → clean URL
- Category Filter + Order · Bajar local move · Save enables · Cancel discard · **real Save 0**

## Network Safety

Category drag/keyboard move: 0 mutation actions. Stock/Estado: RSC navigation only.

## Business Safety

Category positions / rows / products / orders / Storage / DB: **0** writes from this phase.

## Focused Verify

`admin-categories-public-catalog-order-motion-filter-unity-polish.verify.ts` — **PASS**

## Mutation Probes

A–L `VERIFY_PROBES=1` — **FAIL_OK → restore PASS**

## TypeScript

`npx tsc --noEmit` — **PASS**

## Build

`npm run build` — **PASS**

## Diff

`git diff --check` (phase files) — **PASS**

## Functional Delta

Filter **presentation** superseded by owner authorization. Filter **semantics** delta: **0**. Category Order algorithm/action/RPC delta: **0**.

## DB Delta

**0**

## Remaining

REAL CATEGORY SAVE + RESTORE + ADMIN/PUBLIC E2E CERTIFICATION

## Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

## Release

**COMMIT/PUSH/DEPLOY: PAUSED**
