# ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-PRE-FINAL-QA-VISUAL-COPY-POLISH-1

## Result

**PASS — LIFECYCLE ACTION HIERARCHY + CONFIRMATION COPY POLISHED / FUNCTIONAL CONTRACT UNCHANGED**

## Trigger

Owner visual review of active Product lifecycle area: stacked full-width Archive/Delete, verbose confirmations, Archive visually too close to Delete, redundant Advanced→lifecycle separators.

## Owner Visual Findings

1. Lifecycle actions consumed excess vertical space.
2. Archive/Delete should share one row.
3. Lucide icons + text preferred.
4. Double horizontal separators around Advanced / Gestión / sticky footer.
5. Archive confirmation too verbose.
6. Delete confirmation excessively enumerated internals.
7. Archive read too destructive.
8. Lifecycle block felt appended.

## Scope

Presentation + microcopy only in Edit lifecycle section / dialogs / CSS.

## Functional Freeze

actions / queries / DB / RPC / dirty / Storage: **UNCHANGED**

## Source Ownership

- `components/admin/products/edit-product-form.tsx` — labels, icons, dialog copy, Archive confirm class
- `components/admin/products/product-form.module.css` — row layout, hierarchy colors, separator removal
- focused verify + docs

No `actions.ts` / `admin.ts` / public / manual / customization domain changes in this phase delta.

## Active Lifecycle Actions

layout: `grid` `repeat(2, minmax(0, 1fr))` · gap ~8–9px · max-width 28rem  
Archive: **Archivar** + Lucide `Archive` · neutral border  
Delete: **Eliminar** + Lucide `Trash2` · restrained danger text/border  
height: ≥44px · white-space nowrap

## Archived Lifecycle Actions

Restore: **Restaurar** + `RotateCcw` · brand/neutral recovery  
Delete: **Eliminar** + `Trash2` · destructive secondary  
hierarchy: Restore more prominent than Delete

## Icons

Lucide already in project (`lucide-react`). Icons `aria-hidden`; accessible name from visible text.

## Visual Hierarchy

Save sticky primary · Archive neutral secondary · Delete restrained destructive · Restore recovery primary for archived.

## Separator Forensics

| Separator | Owner | Decision |
|-----------|-------|----------|
| A | Advanced `.editHierarchy .advancedDisclosure` `border-bottom` | **KEEP** |
| B | `.lifecycleSection` former `border-top` | **REMOVE** (`border-top: none`) |
| C | `.actionsSticky` `border-top` | **KEEP** |
| lifecycle bottom decorative | n/a | **NONE** |

Result: one meaningful Advanced→lifecycle boundary.

## Vertical Rhythm

Compressed section gap / removed top padding band from former border+padding-top stack.

## Archive Dialog Copy

Title: Archivar producto  
Body: "El producto dejará de mostrarse en el catálogo y no podrás editarlo hasta que lo restaures. Sus datos se conservarán."  
Buttons: Cancelar / **Archivar**  
Style: `.lifecycleArchiveConfirm` — neutral, not danger

## Delete Dialog Copy

Title: Eliminar producto  
Body: "El producto se eliminará permanentemente. Esta acción no se puede deshacer."  
Buttons: Cancelar / **Eliminar**  
Style: `.lifecycleDangerButton` — destructive restrained

## Dialog Styling

Architecture/focus/Escape unchanged. No body icons. No fixed min-height.

## Responsive QA

Source contracts enforce one-row at all widths (`grid-template-columns: repeat(2, minmax(0, 1fr))`).

Local browser (desktop flyout, product Clásica — open/cancel only):

- Archivar + Eliminar same row: bounding boxes y=894, h=44 each, adjacent widths 220
- Archive dialog: concise copy + Cancelar / Archivar (cancelled, no mutation)
- Delete dialog: permanent/irreversible only + Cancelar / Eliminar (cancelled, no mutation)
- Focus return to lifecycle triggers after cancel

360/390/412 mobile viewport matrix: CSS contract verified; full device matrix remains available in FINAL-QA-1.
## Theme QA

Token-only colors (`--border-subtle`, `--color-cancelled`, `--accent-primary`). Light/dark expected PASS via tokens.

## Accessibility

Text labels retained · icons decorative · focus-visible preserved · dialog Escape ownership unchanged.

## Network Safety

Archive/Restore/Delete RPC/Storage: **0** this phase (dialogs open/cancel only allowed).

## Verification

focused polish verify: **PASS**  
probes A–F: **FAIL_OK → restore PASS**  
implementation verify: **PASS** (label assertions reconciled)  
dirty / unified / Advanced motion: **PASS**  
tsc: **PASS**  
build: **PASS**  
diff: **PASS** (CRLF warnings only)

## Mutation Probes

A stacked · B no Archive icon · C Archive destructive · D verbose Delete · E no irreversible · F lifecycle top border — all FAIL_OK then restored.

## Regression Checks

Sticky Save · Advanced · dirty lifecycle · Create — unchanged functionally.

## Data Safety

product/order/customization/Storage/schema/RLS/RPC/history mutations: **0**

## Runtime Delta

`edit-product-form.tsx`, `product-form.module.css`, polish verify, docs, CURRENT_PHASE, living audit/memory; implementation verify label reconciliation only.

## Functional Delta

**0** domain behavior changes

## Remaining Lifecycle QA

Disposable Archive/Restore/Delete/Storage/public/manual browser matrix → **FINAL-QA-1**

## Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1**

## Release

**COMMIT / PUSH / DEPLOY: PAUSED**
