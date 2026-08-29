# ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-NUMERIC-GUTTER-VISUAL-FIX-1

**Date:** 2026-08-21  
**Gate:** PASS WITH REAL-DEVICE QA DEBT  
**Baseline commit:** 81b1162 (uncommitted working tree)

## 1. Objective

Increase optical separation between **per-unit** and **operational-total** on quantity-enabled mobile preparation rows so `×4 c/u` and `8 total` read as two values, not one string — without changing three-track architecture, semantics, or desktop.

## 2. Previous visual defect

Geometry remained `label | per-unit | total` with shared `column-gap: 0.45rem` (~7.2px) between all tracks. Per-unit and total sat optically adjacent (`×4 c/u 8 total`). **P3** scanability / rhythm only; no functional defect.

## 3. Frozen three-track contract

```text
label | per-unit | operational-total
grid-template-columns: minmax(0, 1fr) max-content max-content;
```

Unchanged. No return to stacked metadata. No fourth track.

## 4. CSS owner

`components/admin/orders/order-items.module.css`  
Selector scope: `@media (max-width: 719px)` → `.preparationOptionQuantityEnabled .preparationOptionTotal`

TSX / mapper: **not modified**.

## 5. Numeric gutter decision

- Keep existing `column-gap` for label → per-unit compactness.
- Add asymmetric `margin-left: 0.5rem` (~8px) on `.preparationOptionTotal` only (quantity-enabled).
- At `≤359px`: `margin-left: 0.35rem` (with existing tighter column-gap) to protect 360-class density.

Effective per-unit ↔ total gap @390 (measured): **~15.2px** (within 12–16px optical target).

## 6. 360 QA

| Check | Result |
| ----- | ------ |
| Per-unit | `×4 c/u` / `×1 c/u` nowrap |
| Total | `8 total` / `2 total` nowrap |
| Gap | ~15.2px |
| Wrap | none on numeric tracks |
| Overflow | none (`scrollWidth <= clientWidth`) |
| Result | **PASS** |

## 7. 390 QA

Primary PO gate. Gap ~15.2px; label→per-unit remains ~7.2px. Reads as `×4 c/u    8 total` without over-spreading. **PASS**

## 8. 430 QA

Same gutter (~15.2px); numeric pair stays a compact block (max-content tracks, not space-between). **PASS**

## 9. Long labels

`minmax(0, 1fr)` preserved; numeric tracks `max-content` + nowrap. No forced ellipsis. Long labels wrap; axes stable. **PASS** (geometry)

## 10. Parent qty >1

Fixture `#AF33` / `2× BBQ Bacon`: unit price, line total, Ambas coverage, `×4 c/u`, `8 total` all preserved. **PASS**

## 11. Simple rows regression

- Coverage (`Papas grandes … Ambas`): two-track unchanged.
- Simple qty (`Bacon ×4` on parent qty 1): no fake total column. **PASS**

## 12. Shared detail impact

`/admin/orders/[id]` @390: same ~15.2px gutter; intentional shared CSS. **PASS**

## 13. Desktop zero delta

Mobile rule scoped `≤719`. @1440: `margin-left: 0` on total; desktop subgrid untouched. **NONE** visible delta. **PASS**

## 14. Light/dark

Spacing-only; no token/color/weight changes. Dark verified in agent matrix; light inherits same geometry. **PASS**

## 15. Overflow

360 / 390 / 430: workspace / product card / quantity-enabled row — no horizontal overflow. **PASS**

## 16. Accessibility

DOM order remains option → per-unit → total. Visual order matches. No ARIA / reorder. **PASS**

## 17. Regression checks

| Check | Result |
| ----- | ------ |
| `order-preparation.verify.ts` | PASS |
| `pending-status-mutation-finalization.verify.ts` | PASS |
| `admin-contextual-default.verify.ts` | PASS |

## 18. Static checks

| Check | Result |
| ----- | ------ |
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | known ESLint 9 circular JSON only |

## 19. Files changed

- `components/admin/orders/order-items.module.css` — asymmetric total gutter
- Docs: this file, three-track follow-up, `CURRENT_PHASE.md`, living audit changelog, living memory

Runtime / TSX / mapper: **NONE**

## 20. P0–P3

- P0 / P1 / P2: none
- P3: real Android device QA **NOT EXECUTED** (accepted debt, same as prior mobile phases)

## 21. Gate

```text
ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-NUMERIC-GUTTER-VISUAL-FIX-1
= PASS WITH REAL-DEVICE QA DEBT

DESKTOP WORKSPACE: REMAINS FROZEN
MOBILE WORKSPACE: FROZEN
Dashboard overall polish: OPEN

No commit. No push. No deploy.
```
