# ADMIN-ORDER-WORKSPACE-PREPARATION-COLUMN-ALIGNMENT-VISUAL-FIX-1

**Date:** 2026-08-18  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Presentation-only — column track geometry for admin preparation comanda

---

## 1. Problem

Real desktop QA on the preparation renderer showed P2 column geometry debt from the prior per-unit/total polish phase:

- `×N c/u` and `N total` appeared visually glued (e.g. `×4 c/u 8 total`)
- Product header and body rows used different column axes
- `Ambas`, `8 total`, `2 total` did not form a stable right-aligned terminal column
- Per-unit and total/coverage tracks lacked shared vertical guides across header and body

Semantic contract, mapper, pricing, and copy were correct — only layout geometry needed correction.

---

## 2. QA evidence

Owner screenshot (desktop, parent qty=2):

```text
Agregados extra   Bacon     ×4 c/u 8 total
                  Cheddar   ×4 c/u 8 total
                  Huevo     ×1 c/u 2 total
```

Per-unit and operational total read as one token cluster instead of two distinct columns.

---

## 3. Previous geometry

- Product header: independent 3-column grid (`1fr auto auto`) with ~0.85rem gap
- Body groups: 2-column layout (group label | options list)
- Options: nested 3-column grid (`1fr auto auto`) with ~0.75rem gap
- Header tracks and body tracks were not derived from the same template
- No reserved group column in header; option column absorbed excess width inconsistently

---

## 4. New track system

Shared CSS variables on `.preparationProduct` at `@media (min-width: 720px)`:

| Track | Definition | Role |
|-------|------------|------|
| Group | `minmax(6.75rem, 8.75rem)` | Compact group descriptor |
| Option | `minmax(0, 1fr)` | Flexible option/product name |
| Per-unit | `minmax(5.5rem, max-content)` | `$X c/u`, `×N c/u` |
| Total/coverage | `minmax(4.75rem, max-content)` | `$lineTotal`, `Ambas`, `N total` |
| Gap | `1rem` column-gap | Explicit separation per-unit ↔ total |

Implementation: CSS Grid + subgrid on `.preparationGroup`, `.preparationOptions`, `.preparationOption` so all rows in a product unit share identical tracks.

---

## 5. Header alignment

- Unified `.preparationProductRowTracked` / `.preparationProductButtonTracked` use the same 4-track template
- Product title → column 2 (option track); column 1 empty (aligns with group column below)
- Unit price → column 3, `justify-self: end`
- Line total → column 4, `justify-self: end`
- qty=1: empty unit-price placeholder (`aria-hidden`) preserves track without visible hole

---

## 6. Body alignment

- `.preparationGroups` defines parent 4-column grid
- Each group/options/option uses `grid-template-columns: subgrid`
- Option name → column 2; per-unit → column 3; total/coverage → column 4
- Hidden placeholders (`aria-hidden`) preserve column width for standard selections

---

## 7. `Ambas`

`Ambas` renders in column 4 (total/coverage track), right-aligned — same terminal track as `8 total`, `2 total`, `N total`.

---

## 8. Per-unit vs total spacing

1rem `column-gap` between per-unit and total tracks (grid-level, not per-row margins). Target: unmistakable separation without excessive whitespace.

---

## 9. Responsive

| Viewport | Behavior |
|----------|----------|
| ≥720px | 4-track shared grid + subgrid |
| <720px | Stacked: product name + line total row 1; unit price row 2 when qty>1; options stack name then per-unit/total lines; no forced 4-column squeeze |

---

## 10. Long-content behavior

- Option column: `min-width: 0`, wraps naturally
- Per-unit/total: `max-content` minmax + `white-space: nowrap` on desktop
- Numeric width variation (`2 total` … `100 total`, `$3.000 c/u` … `$123.500 c/u`) handled by content-aware tracks

---

## 11. Functional boundaries

| Area | Changed |
|------|---------|
| Mapper (`order-preparation.ts`) | NO |
| Semantics / copy / pricing | NO |
| Surfaces (border, radius, background) | NO |
| Adicional structure | NO |
| Order total | NO |
| Realtime / reconciliation / actions | NO |
| DB / public / OrderCard / WhatsApp | NO |
| Network requests | +0 |

---

## 12. Checks

| Check | Result |
|-------|--------|
| `order-preparation.verify.ts` | PASS |
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | known ESLint 9 circular JSON |

---

## 13. Visual QA

| Surface | Status |
|---------|--------|
| Desktop real (authenticated) | pending |
| Mobile ~390px | structural (stack) verified in CSS |
| Dark / light | theme-neutral tokens; session QA pending |

---

## 14. Findings (P0–P3)

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 column alignment | **CLOSED** (geometry fix applied) |
| P2 | Authenticated viewport matrix still pending |
| P3 | Product detail modal still flat summary |

---

## 15. Gate

**ADMIN-ORDER-WORKSPACE-PREPARATION-COLUMN-ALIGNMENT-VISUAL-FIX-1** = **PASS WITH VISUAL QA DEBT**

P2 column geometry closed in code. Authenticated real-order viewport confirmation remains open.

---

## Follow-up after real authenticated QA

**ADMIN-ORDER-WORKSPACE-PREPARATION-PRODUCT-HEADER-TRACK-REGRESSION-FIX-1** (2026-08-18)

- Body column geometry remained valid
- Shared header/body 4-track implementation caused product-header P2 regression (`N×` wrapping/overlap; empty Group track offset; qty=1 placeholder)
- Header ownership separated in follow-up: `docs/admin-order-workspace-preparation-product-header-track-regression-fix-1.md`

Qualified P2:

- BODY COLUMN ALIGNMENT = CLOSED
- PRODUCT HEADER REGRESSION = FIXED BY FOLLOW-UP

Body density refined in `ADMIN-ORDER-WORKSPACE-PREPARATION-NUMERIC-DENSITY-VISUAL-POLISH-1` (2026-08-19): semantic tracks preserved; option track capped; tabular numerals applied.

---

## Files changed

| File | Change |
|------|--------|
| `components/admin/orders/order-items.module.css` | Shared 4-track grid, subgrid body, 1rem per-unit/total gap |
| `components/admin/orders/order-preparation-items.tsx` | Unified tracked header row; qty=1 unit-price placeholder for track stability |
