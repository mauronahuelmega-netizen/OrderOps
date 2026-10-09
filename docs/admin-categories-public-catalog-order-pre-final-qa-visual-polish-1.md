# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-PRE-FINAL-QA-VISUAL-POLISH-1

## Result

**PASS — CATEGORY ORDER DIALOG VISUAL HIERARCHY + INTERACTION AFFORDANCE POLISHED / FUNCTIONAL CONTRACT UNCHANGED / FINAL QA NEXT**

## Trigger

Owner visual QA after IMPLEMENTATION-1: Filter mode and toolbar Category trigger already strong; Order mode interaction affordances (grip, Up/Down, disabled clarity, Save disabled-vs-active) one refinement tier below frozen Products surfaces.

## Scope

Visual / interaction-affordance only.

Permanent runtime edits:

- `components/admin/products/category-filter-order-dialog.tsx` (state-class / data-attribute wiring only)
- `components/admin/products/category-filter-order-dialog.module.css`

Focused verify + docs.

## Frozen Functional Contract

Preserved:

- Filter URL / `categoryId` / page reset / q·stock·status
- Order entry, local draft, semantic dirty, grip-only Pointer Events, Subir/Bajar
- Cancel discard / Escape Order → Filter / 0 writes
- `saveCategoryDisplayOrderAction` → one `save_category_display_order` RPC
- Stock / Estado native selects
- One native `<dialog>` / two modes
- Exact helper + success copy

No DB / SQL / migration / RLS / RPC / action / URL / business mutations / real Save.

## Owner Visual Findings

| Finding | Disposition |
| --- | --- |
| Toolbar Category trigger strong | PRESERVED |
| Filter mode healthy | PRESERVED |
| Grip too faint | POLISHED (18px icon / 44px hit / grab·grabbing) |
| Up/Down undersized glyphs | POLISHED (18px icon / 44px hit / ghost) |
| Disabled moves easy to miss | POLISHED |
| Pristine Save looked too active | POLISHED (feature-local muted disabled) |
| Dirty Save must read primary | POLISHED (`data-save-enabled`) |
| Order editing hierarchy quiet | Subtle `bodyOrder` surface only |

## Pristine Save Semantic Gate

Source:

`saveEnabled = dirty && !pending && !membershipStale && draftOrder.length >= 2`

`disabled={!saveEnabled}`

Runtime (412 light, Order entry, no move):

- `button.disabled === true`
- `data-save-enabled="false"`

**GATE PASS** — not `CATEGORY_ORDER_VISUAL_POLISH_PRISTINE_SAVE_CONTRACT_FAIL`.

## Source Ownership

| File | Role |
| --- | --- |
| `category-filter-order-dialog.tsx` | `bodyOrder`, `gripDragging`, `data-save-enabled` / `data-save-pending` |
| `category-filter-order-dialog.module.css` | Grip / move / disabled / Save hierarchy / drag / focus / reduced-motion |
| `admin-categories-public-catalog-order-pre-final-qa-visual-polish.verify.ts` | Focused visual + functional freeze asserts + probes A–J |

Not edited: toolbar, draft lib, actions, types, migrations, shared DnD, globals.

## Filter Baseline

Trigger / Todas / rows / Ordenar categorías / Cerrar / shell: **PRESERVED / PASS** (no redesign).

## Order Baseline

Hierarchy: GRIP → NAME → MOVE ACTIONS.

Row measured height: **55px** (≥48; continuous list, no cardification).

## Grip Polish

- Icon: **18×18** (`1.125rem`)
- Hit: **44×44**
- Default visible secondary; hover stronger; focus-visible ring; drag `gripDragging` + `grabbing`
- `touch-action: none` grip-only preserved

## Move Controls Polish

- Icon: **18×18**
- Hit: **44×44**
- Ghost hover/focus/active; accessible names unchanged

## Disabled States

- First Subir / last Bajar: `disabled` + lowered contrast (opacity ~0.5), no hover/active
- Still legible light + dark

## Save Disabled / Active Hierarchy

| State | Semantic | Visual |
| --- | --- | --- |
| Pristine | `disabled=true` / `data-save-enabled=false` | Muted surface + muted fg + `not-allowed` |
| Dirty | `disabled=false` / `data-save-enabled=true` | Primary blue `rgb(37, 99, 235)` + white |
| Revert exact order | disabled again | Muted again |
| Pending | `data-save-pending` | Distinct wait opacity (no new spinner) |

Feature-local override of global `.ui-button:disabled { opacity: 0.6 }` so pristine primary no longer reads active.

## Drag State

`orderRowDragging` + `gripDragging`: restrained surface emphasis; no scale / layout shift.

## Focus Visible

Focus-visible rings on filter options, grip, Subir/Bajar, footer actions. Pointer focus not persistent.

## Order Mode Hierarchy

Subtle `bodyOrder` list surface + helper rhythm. No banners / chips / “Sin guardar”.

## Responsive

| Viewport | Result |
| --- | --- |
| 360 | PASS — grip 44, footer visible, overflowX 0 |
| 390 | PASS (light dirty/pristine + dark) |
| 412 | PASS |
| short 390×640 | PASS — title visible, footer reachable, overflowX 0 |
| 899 | PASS |
| 1024 desktop | PASS |

## Short Viewport

Title visible · list surface usable · sticky footer reachable · no page-behind scroll regression · horizontal overflow 0.

## Light

Grip discoverable · disabled arrows distinct · pristine Save unmistakably muted · dirty Save primary.

## Dark

Theme via admin Apariencia toggle (`data-dashboard-theme=dark`).

Grip `rgb(203,213,225)` · disabled Up distinct · muted Save · dirty Save `rgb(37,99,235)` · dividers restrained.

## Long Labels

Synthetic DOM label (restored immediately, no business write):

- `text-overflow: ellipsis`
- grip/move fixed 44
- actions reachable
- overflowX 0

## Runtime Visual QA

Exercised authenticated `/admin/products`:

- Filter baseline
- Order pristine / dirty / revert
- Cancel discard → Filter
- Escape/cancel-event discard → Filter
- Dark pristine + dirty (Cancel, no Save)
- 360 / 390 / 412 / short / 899 / 1024

Real Save clicks: **0**

## Network Safety

Local drag/move/Cancel/Escape/Filter open-close: **0 mutation calls** during visual QA.

## Business Safety

Category rows / positions / products / orders / Storage deltas: **0**

## Focused Verify

`lib/categories/admin-categories-public-catalog-order-pre-final-qa-visual-polish.verify.ts`

**PASS**

## Mutation Probes

`VERIFY_PROBES=1` A–J: **FAIL_OK → restore PASS**

## TypeScript

`npx tsc --noEmit` → **PASS**

## Build

`npm run build` → **PASS**

## Diff

`git diff --check` (phase files) → **PASS**

Phase-owned runtime:

- `category-filter-order-dialog.tsx`
- `category-filter-order-dialog.module.css`
- focused verify
- docs

No DB / action files.

## Functional Delta

**0**

## DB Delta

**0**

## Remaining

REAL SAVE + RESTORE + PUBLIC/ADMIN E2E CERTIFICATION

## Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

## Release

**COMMIT/PUSH/DEPLOY: PAUSED**
