# ADMIN-ORDER-WORKSPACE-PREPARATION-PRODUCT-HEADER-TRACK-REGRESSION-FIX-1

**Date:** 2026-08-18  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Presentation-only — product header geometry; body 4-track grid frozen

---

## 1. Regression

Authenticated desktop QA after `ADMIN-ORDER-WORKSPACE-PREPARATION-COLUMN-ALIGNMENT-VISUAL-FIX-1` showed:

- Body column separation improved / visually acceptable
- Product header P2: `2× BBQ Bacon` wrapping as `2×` / `BBQ` / `Bacon`
- `2×` overlapping `$22.250 c/u`
- `1× Doble Smash` wrapping as `1×` / `Doble` / `Smash` despite unused card width
- Header title starting too far right (empty Group track)

---

## 2. Root cause

The previous phase forced HEADER onto the BODY four-track template:

`[EMPTY GROUP] | PRODUCT TITLE | UNIT PRICE | LINE TOTAL`

Title lived in column 2. Combined with `flex-wrap` on qty + name, the identity lost usable width and split unnaturally. Qty=1 used an `aria-hidden` unit-price placeholder solely to keep that 4-track geometry.

HEADER AND BODY SHARE VISUAL RHYTHM, NOT THE SAME CSS GRID.

---

## 3. Real QA evidence

Owner case: parent qty=2 (`BBQ Bacon`) + parent qty=1 (`Doble Smash`). Body `Ambas` / `×N c/u` / `N total` remained valid. Header identity and left-edge ownership failed.

---

## 4. Previous shared 4-track header

- `.preparationProductRowTracked` / `.preparationProductButtonTracked`
- Title → column 2; empty group column 1
- Hidden unit-price cell for qty=1
- Shared `--prep-track-*` with body

Removed from header only. Body tracks unchanged.

---

## 5. New independent header layout

Dedicated `.preparationProductHeader` grid, independent of body subgrid.

| Case | Tracks |
|------|--------|
| qty > 1 | `minmax(0, 1fr) max-content max-content` |
| qty = 1 | `minmax(0, 1fr) max-content` |

Product identity starts at the header’s natural left padding. Financial values occupy `max-content` only. `column-gap: 1rem`.

---

## 6. qty=1

`1× Doble Smash` + line total. No empty unit-price track. Hidden placeholder removed.

---

## 7. qty>1

`2× BBQ Bacon` + `$unitPrice c/u` + line total on one desktop row when space allows. Title is flexible; financial tracks consume required width only.

---

## 8. Body freeze

Body remains:

GROUP | OPTION | PER UNIT | TOTAL/COVERAGE

`Ambas`, `×N c/u`, `N total` semantics and subgrid alignment unchanged.

---

## 9. Responsive

| Viewport | Header |
|----------|--------|
| ≥720px | Independent 2- or 3-track financial header |
| <720px | Title + line total row 1; unit price row 2 when qty>1 |

Body breakpoint (720px) unchanged. Header may stack independently.

---

## 10. Multiple products

Same CSS template for every product unit. Qty>1 uses 3-track header; qty=1 uses 2-track. No empty Group indentation on either.

---

## 11. Long names

Title is inline identity (`qty` + name), `min-width: 0`, natural wrap. No ellipsis. No name parsing. Qty stays with the first line when width allows; wrap is word-level, not a qty-only column.

---

## 12. Accessibility

- Visible copy remains real DOM text
- Meaningless qty=1 placeholder removed
- Clickable product row / focus-visible preserved
- No nested button change

---

## 13. Checks

| Check | Result |
|-------|--------|
| `order-preparation.verify.ts` | PASS |
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | known ESLint 9 circular JSON |

---

## 14. Findings (P0–P3)

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 header track regression | **CLOSED** (geometry fix applied) |
| P2 | Authenticated viewport matrix still pending |
| P3 | Product detail modal still flat summary |

---

## 15. Gate

**ADMIN-ORDER-WORKSPACE-PREPARATION-PRODUCT-HEADER-TRACK-REGRESSION-FIX-1** = **PASS WITH VISUAL QA DEBT**

Header ownership restored in code. Authenticated real-order confirmation remains open. Body 4-track remains closed.

---

## Follow-up

**ADMIN-ORDER-WORKSPACE-PREPARATION-NUMERIC-DENSITY-VISUAL-POLISH-1** (2026-08-19)

Reason: header PASS; remaining body density/numeric alignment polish. See `docs/admin-order-workspace-preparation-numeric-density-visual-polish-1.md`.

---

## Files changed

| File | Change |
|------|--------|
| `components/admin/orders/order-preparation-items.tsx` | Dedicated header classes; qty=1 placeholder removed |
| `components/admin/orders/order-items.module.css` | Independent header grid; body 4-track frozen |
